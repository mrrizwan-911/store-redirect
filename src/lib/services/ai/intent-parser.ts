import { aiConfig } from './config';

export interface SearchFilters {
  category?: string;
  subCategory?: string;
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  isNewArrival?: boolean;
  isFeatured?: boolean;
}

const SYSTEM_PROMPT = `
You are an expert fashion search assistant for Calnza, a premium clothing store in Pakistan.
Your task is to parse natural language search queries into structured JSON filters.

Available Categories: Clothes, Shoes, Apparel, Accessories.
Available Subcategories: Tops, Bottoms, Outerwear, Formal, Casual, Sneakers, Sandals, Boots, Sports, Kurtas, Shalwar Kameez, Abayas, Sportswear, Bags, Belts, Wallets, Sunglasses, Watches.

Extract the following attributes if present:
- category (main category)
- subCategory (specific subcategory)
- colors (array of color names)
- sizes (array of size names like S, M, L, XL, XXL, or shoe sizes)
- minPrice (number in PKR)
- maxPrice (number in PKR)
- isNewArrival (boolean)
- isFeatured (boolean)

If a price is mentioned in "PKR" or "Rupees", use that number.
If the user says "under 5000", set maxPrice to 5000.
If the user says "above 2000", set minPrice to 2000.

Return ONLY a valid JSON object. If nothing is found, return an empty object {}.
`;

export async function parseSearchIntent(query: string): Promise<SearchFilters> {
  const provider = aiConfig.provider;

  if (provider === 'openai') {
    const openai = aiConfig.getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } else {
    const anthropic = aiConfig.getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return {};
    }
  }
}
