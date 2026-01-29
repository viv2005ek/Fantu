import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';
import { VisionContext } from '../types';

let model: cocoSsd.ObjectDetection | null = null;

export async function loadObjectDetectionModel(): Promise<void> {
  if (!model) {
    console.log('Loading TensorFlow and COCO-SSD model...');
    await tf.ready();
    console.log('TensorFlow ready');
    model = await cocoSsd.load();
    console.log('COCO-SSD model loaded successfully');
  } else {
    console.log('COCO-SSD model already loaded');
  }
}

export async function detectObjects(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!model) {
    await loadObjectDetectionModel();
  }
  return await model!.detect(imageElement);
}

export async function extractText(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<string> {
  try {
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(imageElement);
    await worker.terminate();
    return data.text.trim();
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
}

export function analyzeDepth(objects: Array<{ class: string; score: number; bbox: number[] }>): string {
  if (objects.length === 0) return 'No objects detected for depth analysis.';

  const sortedBySize = [...objects].sort((a, b) => {
    const areaA = a.bbox[2] * a.bbox[3];
    const areaB = b.bbox[2] * b.bbox[3];
    return areaB - areaA;
  });

  const depthDescriptions: string[] = [];

  sortedBySize.forEach((obj, index) => {
    const area = obj.bbox[2] * obj.bbox[3];
    let depthLevel = '';

    if (index === 0 && area > 50000) {
      depthLevel = 'very close/foreground';
    } else if (area > 30000) {
      depthLevel = 'close';
    } else if (area > 10000) {
      depthLevel = 'middle distance';
    } else {
      depthLevel = 'far/background';
    }

    depthDescriptions.push(`${obj.class} (${depthLevel})`);
  });

  return depthDescriptions.join(', ');
}

export async function processVisionSnapshot(
  canvas: HTMLCanvasElement
): Promise<VisionContext> {
  console.log('Starting vision snapshot processing...');
  const timestamp = new Date();

  console.log('Detecting objects...');
  const objects = await detectObjects(canvas);
  console.log('Objects detected:', objects.length);

  console.log('Extracting text...');
  const text = await extractText(canvas);
  console.log('Text extracted:', text ? text.substring(0, 50) : 'none');

  const depthInfo = analyzeDepth(objects);

  let description = '';

  if (objects.length > 0) {
    const objectList = objects.map(obj => {
      const confidence = Math.round(obj.score * 100);
      const [x, y, width, height] = obj.bbox;
      const area = width * height;

      let position = '';
      if (area > 50000) {
        position = 'very close in front of the camera';
      } else if (area > 30000) {
        position = 'close to the camera';
      } else if (area > 10000) {
        position = 'at medium distance';
      } else {
        position = 'in the background';
      }

      return `a ${obj.class} (${confidence}% confidence, ${position})`;
    }).join(', ');

    description = `I can see ${objectList}`;

    if (text && text.length > 3) {
      description += `. There is also visible text that reads: "${text.substring(0, 100)}"`;
    }
  } else {
    description = 'I cannot detect any recognizable objects in the current camera view';
    if (text && text.length > 3) {
      description += `, but I can see some text: "${text.substring(0, 100)}"`;
    }
  }

  console.log('Vision description:', description);

  return {
    timestamp,
    objects: objects.map(obj => ({
      class: obj.class,
      score: obj.score,
      bbox: obj.bbox
    })),
    text,
    description
  };
}
