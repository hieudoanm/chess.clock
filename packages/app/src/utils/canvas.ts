import html2canvas from 'html2canvas-pro';
import { RefObject } from 'react';

export const download = async ({
  ref,
  output = '',
}: {
  ref: RefObject<HTMLDivElement | null>;
  output: string;
}) => {
  if (ref.current) {
    await new Promise((resolve) => requestAnimationFrame(resolve)); // Wait for rendering
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      useCORS: true,
    });
    const dataURL = canvas.toDataURL('image/png');
    // Create a download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${output}.png`;
    link.click();
    link.remove();
  }
};
