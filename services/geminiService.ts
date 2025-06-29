
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ReportData } from '../types';

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; }; }> {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as string."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

const getPrompt = () => {
  const jsonFormat = `{
    "summary": "Breve resumen del incidente basado en las imágenes.",
    "probable_cause": "Análisis de la causa probable del accidente y una estimación de la culpabilidad. Incluye una advertencia de que es una estimación y no una conclusión legal.",
    "vehicles": [
      {
        "description": "Descripción del vehículo (ej. 'Sedán azul', 'SUV blanco').",
        "damage_analysis": "Descripción detallada de los daños visibles en el vehículo.",
        "estimated_impact_speed": "Estimación de la velocidad de impacto si es posible determinarla, con una advertencia sobre la imprecisión."
      }
    ]
  }`;

  return `Actúa como un perito experto en reconstrucción de accidentes de tráfico. Tu tarea es analizar las siguientes imágenes de un accidente automovilístico y generar un informe detallado.

  **Instrucciones:**
  1.  Examina todas las imágenes proporcionadas para comprender la escena, la posición de los vehículos, los daños y el entorno.
  2.  Proporciona un análisis objetivo basado únicamente en la evidencia visual.
  3.  Estructura tu respuesta exclusivamente en el formato JSON que se especifica a continuación. No incluyas texto introductorio, explicaciones adicionales ni la palabra "json" al principio de tu respuesta.
  
  **Formato JSON Requerido:**
  ${jsonFormat}

  **Directrices para cada campo:**
  -   **summary**: Un párrafo conciso que resuma el evento.
  -   **probable_cause**: Evalúa la dinámica del choque. Basa tu juicio en los puntos de impacto, la posición final de los coches y cualquier señal de tráfico visible. **Incluye obligatoriamente una advertencia** que indique que esto es un análisis preliminar basado en fotos y no una determinación legal de culpabilidad.
  -   **vehicles**: Un array que contenga un objeto por cada vehículo claramente identificable en el accidente.
    -   **description**: Identifica el vehículo por su tipo y color (ej., "Sedán Toyota Corolla azul", "Camioneta Ford F-150 negra").
    -   **damage_analysis**: Describe con detalle las abolladuras, arañazos, roturas y deformaciones. Sé específico sobre la ubicación del daño (ej., "Abolladura severa en la puerta delantera del conductor y el guardabarros izquierdo", "Parachoques trasero desprendido").
    -   **estimated_impact_speed**: Si es posible, proporciona una estimación de la velocidad del impacto (ej., "Baja velocidad, probablemente menos de 20 km/h", "Velocidad moderada, entre 40-60 km/h"). **Siempre incluye una advertencia** de que esta es una estimación aproximada y sujeta a un análisis más profundo.

  Analiza las imágenes y devuelve el informe en el formato JSON especificado.`;
};

export const generateReportFromImages = async (photos: File[]): Promise<ReportData> => {
  if (!process.env.API_KEY) {
    throw new Error("La clave de API de Google no está configurada. Por favor, configure la variable de entorno API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = await Promise.all(photos.map(fileToGenerativePart));

  const textPart = {
    text: getPrompt(),
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: { parts: [textPart, ...imageParts] },
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as ReportData;
    return parsedData;

  } catch (error) {
    console.error("Error al generar el informe desde Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Error en la API de Gemini: ${error.message}`);
    }
    throw new Error("Ocurrió un error desconocido al comunicarse con la API de Gemini.");
  }
};
