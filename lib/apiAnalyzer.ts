import { ComponentType, Suggestion, ComponentData } from '../types';

export const analyzeApiData = (data: any, url: string): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  
  // Use URL from data object if available, otherwise use the input URL
  const targetUrl = (typeof data === 'string' ? data : data?.url) || url;

  // 1. Detect Media based on URL string
  if (targetUrl && typeof targetUrl === 'string') {
    
    // Check for PDF
    if (targetUrl.match(/\.(pdf)(\?.*)?$/i)) {
      suggestions.push({
        type: ComponentType.PDF_VIEWER,
        confidence: 0.95,
        reason: "URL ends in .pdf",
        previewData: { pdfUrl: targetUrl, title: "Document Viewer" }
      });
    }
    
    // Check for Image
    if (targetUrl.match(/\.(jpeg|jpg|png|webp|gif|bmp)(\?.*)?$/i) || targetUrl.includes('picsum.photos')) {
      suggestions.push({
        type: ComponentType.IMAGE_VIEWER,
        confidence: 0.95,
        reason: targetUrl.includes('picsum.photos') ? "Recognized image service" : "URL ends in image extension",
        previewData: { image: targetUrl, title: "Image Preview" }
      });
    }

    // Check for Video (YouTube or MP4)
    if (targetUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      suggestions.push({
        type: ComponentType.VIDEO_PLAYER,
        confidence: 0.95,
        reason: "URL looks like a video",
        previewData: { videoUrl: targetUrl, title: "Video Player" }
      });
    }
  }

  // 2. Detect Array (Table or Charts)
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      
      // Table is always a good candidate for arrays of objects
      suggestions.push({
        type: ComponentType.TABLE,
        confidence: 0.9,
        reason: "Detected list of objects",
        previewData: { dataset: data, title: "Data Table" }
      });

      // Check for numeric values for Charts
      const numericKeys = keys.filter(k => typeof data[0][k] === 'number');
      if (numericKeys.length > 0) {
        suggestions.push({
          type: ComponentType.CHART_BAR,
          confidence: 0.8,
          reason: "Detected numeric data suitable for comparison",
          previewData: { dataset: data, title: "Bar Analysis" }
        });
        suggestions.push({
          type: ComponentType.CHART_LINE,
          confidence: 0.75,
          reason: "Detected numeric data suitable for trends",
          previewData: { dataset: data, title: "Trend Analysis" }
        });
        if (data.length <= 10) {
             suggestions.push({
            type: ComponentType.CHART_PIE,
            confidence: 0.6,
            reason: "Small dataset with numbers",
            previewData: { dataset: data, title: "Distribution" }
          });
        }
      }
    }
  }

  // 3. Detect Objects (Cards, Hero)
  if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    const hasImage = keys.some(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('img') || k.toLowerCase().includes('photo') || k.toLowerCase().includes('bg') || k.toLowerCase().includes('background'));
    const hasTitle = keys.some(k => k.toLowerCase().includes('title') || k.toLowerCase().includes('header'));
    
    // Hero Section Detection
    if (hasImage && hasTitle && keys.some(k => k.toLowerCase().includes('subtitle') || k.toLowerCase().includes('tagline'))) {
        suggestions.push({
            type: ComponentType.HERO,
            confidence: 0.85,
            reason: "Object looks like a Hero/Header section",
            previewData: {
                title: data.title || data.header,
                subtitle: data.subtitle || data.tagline || data.description,
                image: data.image || data.bg || data.background,
                text: "Call to Action"
            }
        });
    }

    // Complex Card
    if (hasImage && hasTitle) {
      suggestions.push({
        type: ComponentType.COMPLEX_CARD,
        confidence: 0.9,
        reason: "Detected Object with Title and Image",
        previewData: {
            title: data.title || data.name || "Card Title",
            image: data.image || data.img || data.photo,
            text: data.description || data.desc || data.bio,
            points: data.features || [],
            value: data.price
        }
      });
    }

    // Stat Card
    const potentialValues = keys.filter(k => 
        (typeof data[k] === 'number' || (typeof data[k] === 'string' && data[k].length < 10))
        && !k.toLowerCase().includes('id')
    );
    
    if (potentialValues.length > 0 && potentialValues.length < 5) {
        suggestions.push({
            type: ComponentType.STAT_CARD,
            confidence: 0.8,
            reason: "Detected simple metrics",
            previewData: {
                title: potentialValues[0], 
                value: data[potentialValues[0]],
                subtitle: potentialValues[1] ? `${potentialValues[1]}: ${data[potentialValues[1]]}` : undefined
            }
        });
    }
    
    // Fallback: Paragraph/JSON dump
    suggestions.push({
        type: ComponentType.PARAGRAPH,
        confidence: 0.3,
        reason: "Generic object text",
        previewData: {
            text: JSON.stringify(data, null, 2),
            title: "Raw Data"
        }
    });
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};