import { aiConfig } from './config';
import { SearchFilters } from './intent-parser';

const SYSTEM_PROMPT = `
You are an expert fashion analyst for Calnza, a premium clothing store in Pakistan.
You will be provided with an image of a person or a clothing item.
Your task is to identify the clothing item and extract its attributes into structured JSON.

Available Categories: Clothes, Shoes, Apparel, Accessories.
Available Subcategories: Tops, Bottoms, Outerwear, Formal, Casual, Sneakers, Sandals, Boots, Sports, Kurtas, Shalwar Kameez, Abayas, Sportswear, Bags, Belts, Wallets, Sunglasses, Watches.

Extract the following attributes:
- category (main category)
- subCategory (specific subcategory)
- colors (array of primary and secondary colors)
- description (a short search string summarizing the item's style, e.g., "embroidered black kurta with gold detail")

Return ONLY a valid JSON object.
`;

export async function analyzeImage(imageSource: string): Promise<SearchFilters & { description: string }> {
  const provider = aiConfig.provider;

  // imageSource should be a base64 encoded string or a public URL
  const isUrl = imageSource.startsWith('http');

  if (provider === 'openai') {
    const openai = aiConfig.getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image and find similar products in our catalog.' },
            {
              type: 'image_url',
              image_url: {
                url: isUrl ? imageSource : `data:image/jpeg;base64,${imageSource}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } else {
    const anthropic = aiConfig.getAnthropic();
    const messageContent: any = [
      {
        type: 'image',
        source: isUrl ? {
          type: 'url',
          url: imageSource
        } : {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageSource
        }
      },
      {
        type: 'text',
        text: 'Analyze this image and find similar products in our catalog. Return JSON only.'
      }
    ];

    // Note: Anthropic vision models might have slightly different input structures
    // For now, using standard message creation
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return { description: 'Search results' };
    }
  }
}
