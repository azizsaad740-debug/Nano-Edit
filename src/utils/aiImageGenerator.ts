const getRandomImageUrl = (width: number, height: number, prompt: string = "abstract") => {
  const keywords = prompt.split(' ').slice(0, 2).join(','); // Use first two words of prompt as keywords
  return `https://source.unsplash.com/random/${width}x${height}/?${keywords || 'abstract'}`;
};

export const generateImageApi = async (prompt: string, width: number, height: number): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return getRandomImageUrl(width, height, prompt);
};

export const generativeFillApi = async (prompt: string): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  // For generative fill, we'll just return a random image that will be masked
  return getRandomImageUrl(512, 512, prompt); // Assuming a standard size for the generated fill piece
};