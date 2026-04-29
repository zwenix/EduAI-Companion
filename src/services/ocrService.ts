import { OCRProvider } from '../contexts/AiContext';

export const performOCR = async (
  base64ImageData: string, 
  provider: OCRProvider, 
  geminiFallback: (base64Image: string) => Promise<{ extractedText: string }>
): Promise<{ extractedText: string }> => {
  if (provider === 'ocrspace') {
    try {
      const apiKey = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K82110486088957'; 

      const formData = new FormData();
      formData.append('base64Image', base64ImageData);
      formData.append('apikey', apiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.[0] || 'OCR Space processing error');
      }

      if (data.ParsedResults && data.ParsedResults.length > 0) {
        return { extractedText: data.ParsedResults[0].ParsedText || '' };
      }
      return { extractedText: '' };
    } catch (error) {
      console.error('OCR Space failed, falling back to Gemini', error);
      return geminiFallback(base64ImageData);
    }
  } else {
    return geminiFallback(base64ImageData);
  }
};
