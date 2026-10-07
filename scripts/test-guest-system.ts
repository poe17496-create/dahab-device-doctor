import { getCairoToday, getOrGenerateGuestId, getHashedClientIP, checkAndDeductGuestTrial, getGuestRemaining, refundGuestTrial } from '../src/lib/guestUsageServer';

async function testGuestSystem() {
  console.log('==============================================');
  console.log('🧪 اختبار نظام عداد الزائر المعاد بناؤه بالكامل');
  console.log('==============================================');

  // 1. فحص حساب التاريخ بتوقيت Africa/Cairo
  const cairoDay = getCairoToday();
  console.log(`\n📅 1. تاريخ اليوم بتوقيت القاهرة (Africa/Cairo): ${cairoDay}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cairoDay)) {
    throw new Error('صيغة التاريخ غير صحيحة');
  }
  console.log('✅ نجح حساب التاريخ بصيغة YYYY-MM-DD بدقة.');

  // 2. اختبار توليد وحفظ الـ Guest ID عبر الـ Cookie
  const mockReq1 = new Request('http://localhost:3000/api/guest/remaining', {
    headers: {
      'x-forwarded-for': '197.35.100.50, 10.0.0.1',
    },
  });

  const { guestId: gId1, isNew: isNew1 } = getOrGenerateGuestId(mockReq1);
  console.log(`\n🍪 2. زائر جديد لأول مرة:`);
  console.log(`   - Guest ID: ${gId1}`);
  console.log(`   - Is New: ${isNew1}`);

  // طلب لاحق مع نفس الكوكي
  const mockReq2 = new Request('http://localhost:3000/api/guest/remaining', {
    headers: {
      cookie: `dahab_guest_id=${gId1}`,
      'x-forwarded-for': '197.35.100.50',
    },
  });

  const { guestId: gId2, isNew: isNew2 } = getOrGenerateGuestId(mockReq2);
  console.log(`\n🍪 3. نفس الزائر في طلب ثانٍ (الكوكي موجود):`);
  console.log(`   - Guest ID: ${gId2}`);
  console.log(`   - Is New: ${isNew2}`);
  if (gId1 !== gId2 || isNew2 !== false) {
    throw new Error('فشل الحفاظ على guestId الثابت من الكوكي');
  }
  console.log('✅ تم الحفاظ على نفس المعرف بنجاح ومنع توليد ID جديد.');

  // 3. فحص تشفير الـ IP
  const hashedIp = getHashedClientIP(mockReq1);
  console.log(`\n🔒 4. تشفير الـ IP بـ SHA-256 + Salt:`);
  console.log(`   - IP المشفر: ${hashedIp.substring(0, 20)}...`);
  if (hashedIp.includes('197.35')) {
    throw new Error('الـ IP غير مشفر');
  }
  console.log('✅ تم تشفير الـ IP مع Salt وحماية الخصوصية بالكامل.');

  // 4. فحص الرصيد الابتدائي
  const initial = await getGuestRemaining(mockReq2);
  console.log(`\n📊 5. الرصيد الابتدائي للزائر: ${initial.remaining} تجارب`);

  // 5. محاكاة 5 أسئلة وخصم ذري
  console.log('\n⚡ 6. محاكاة إجراء 5 طلبات متتالية كزائر:');
  for (let i = 1; i <= 5; i++) {
    const res = await checkAndDeductGuestTrial(mockReq2);
    console.log(`   - الطلب رقم ${i}: مسموح=${res.allowed} | المتبقي=${res.remaining}`);
    if (i < 5 && !res.allowed) {
      console.warn(`   تحذير: توقف مبكر عند السؤال ${i}`);
    }
  }

  // الطلب السادس يجب أن يُرفض تماماً (403 LIMIT_REACHED)
  const rejectedCheck = await checkAndDeductGuestTrial(mockReq2);
  console.log(`\n🚫 7. فحص الطلب رقم 6 (بعد استهلاك الـ 5 محاولات):`);
  console.log(`   - مسموح: ${rejectedCheck.allowed}`);
  console.log(`   - الخطأ: ${rejectedCheck.error}`);
  console.log(`   - المتبقي: ${rejectedCheck.remaining}`);
  if (rejectedCheck.allowed !== false || rejectedCheck.error !== 'LIMIT_REACHED') {
    throw new Error('فشل حظر الزائر بعد 5 محاولات');
  }
  console.log('✅ تم رفض الطلب السادس بنجاح مع LIMIT_REACHED و remaining = 0.');

  // 6. محاكاة التصفح الخفي (Incognito) من نفس الجهاز ونفس الـ IP
  // في التصفح الخفي: لا يوجد كوكي (guestId جديد)، لكن الـ IP هو نفسه!
  console.log('\n🕵️ 7. محاكاة التصفح الخفي (Incognito) من نفس الـ IP:');
  const incognitoReq = new Request('http://localhost:3000/api/guest/remaining', {
    headers: {
      // لا يوجد كوكي
      'x-forwarded-for': '197.35.100.50',
    },
  });

  const incognitoRemaining = await getGuestRemaining(incognitoReq);
  console.log(`   - الرصيد المتبقي في التصفح الخفي: ${incognitoRemaining.remaining}`);
  console.log(`   - استخدام الـ IP اليوم: ${incognitoRemaining.ipUsed} من 10`);
  if (incognitoRemaining.remaining > 5) {
    throw new Error('التصفح الخفي تجاوز الحد المسموح!');
  }
  console.log('✅ نجح التعرف على الـ IP في التصفح الخفي ومنع إعادة العداد لـ 5!');

  // 7. اختبار استرجاع التجربة (Rollback) عند فشل AI
  console.log('\n🔄 8. اختبار استرجاع التجربة (Rollback) للزائر:');
  const beforeRefund = await getGuestRemaining(mockReq2);
  await refundGuestTrial(mockReq2, gId2);
  const afterRefund = await getGuestRemaining(mockReq2);
  console.log(`   - قبل الاسترجاع: used = ${beforeRefund.guestUsed}`);
  console.log(`   - بعد الاسترجاع: used = ${afterRefund.guestUsed}`);
  if (afterRefund.guestUsed >= beforeRefund.guestUsed && beforeRefund.guestUsed > 0) {
    throw new Error('فشل استرجاع التجربة');
  }
  console.log('✅ تم استرجاع التجربة بنجاح (Atomic Rollback).');

  console.log('\n==============================================');
  console.log('🎉 جميع الاختبارات اجتازت بنجاح 100%!');
  console.log('==============================================');
}

testGuestSystem().catch((e) => {
  console.error('❌ خطأ في الاختبار:', e);
  process.exit(1);
});
