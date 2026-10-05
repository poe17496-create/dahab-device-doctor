declare module 'duckduckgo-images-api' {
  interface ImageSearchOptions {
    query: string;
    iterations?: number;
    moderate?: boolean;
  }

  interface ImageResult {
    image: string;
    width?: number;
    height?: number;
    source?: string;
    title?: string;
    thumbnail?: string;
  }

  function image_search(options: ImageSearchOptions): Promise<ImageResult[]>;

  export default {
    image_search,
  };
}
