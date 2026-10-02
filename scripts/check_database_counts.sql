-- Check current data counts in expert system tables

SELECT 'engineering_references' as table_name, COUNT(*) as count FROM engineering_references
UNION ALL
SELECT 'case_studies', COUNT(*) FROM case_studies
UNION ALL
SELECT 'repair_logs', COUNT(*) FROM repair_logs
UNION ALL
SELECT 'component_relationships', COUNT(*) FROM component_relationships
UNION ALL
SELECT 'technical_specifications', COUNT(*) FROM technical_specifications
UNION ALL
SELECT 'knowledge_graph', COUNT(*) FROM knowledge_graph
UNION ALL
SELECT 'knowledge_graph_edges', COUNT(*) FROM knowledge_graph_edges
UNION ALL
SELECT 'image_gallery', COUNT(*) FROM image_gallery
UNION ALL
SELECT 'diagnostic_rules', COUNT(*) FROM diagnostic_rules
UNION ALL
SELECT 'quick_reference_guides', COUNT(*) FROM quick_reference_guides;

-- Detailed breakdown by device brand (for case studies)
SELECT device_brand, COUNT(*) as case_study_count
FROM case_studies
GROUP BY device_brand
ORDER BY case_study_count DESC;

-- Detailed breakdown by fault category (for case studies)
SELECT fault_category, COUNT(*) as case_study_count
FROM case_studies
GROUP BY fault_category
ORDER BY case_study_count DESC;
