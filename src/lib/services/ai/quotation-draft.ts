import { aiConfig } from './config';

/**
 * Generates a professional cover letter for a B2B quotation using Claude.
 */
export async function generateQuotationDraft(quotation: any) {
  const anthropic = aiConfig.getAnthropic();

  if (!process.env.ANTHROPIC_API_KEY) {
    return `Dear ${quotation.name},\n\nThank you for your interest in Calnza. We have prepared the bulk order quotation you requested for ${quotation.company || 'your company'}.\n\nPlease find the detailed quotation attached to this email. We look forward to the possibility of working together.\n\nBest regards,\nCalnza Team`;
  }

  const itemsList = Array.isArray(quotation.items)
    ? quotation.items.map((item: any) => `${item.quantity}x ${item.productName || item.name}`).join(', ')
    : 'various products';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: 'You are a professional B2B sales representative for Calnza, a premium luxury apparel brand. Your goal is to write a concise, elegant, and persuasive cover letter for a bulk order quotation.',
      messages: [
        {
          role: 'user',
          content: `Generate a professional cover letter for a quotation request.
          Customer Name: ${quotation.name}
          Company: ${quotation.company || 'N/A'}
          Requested Items: ${itemsList}

          The tone should be sophisticated, helpful, and luxury-oriented. Mention that the detailed quotation is attached. Keep it under 200 words. Do not use placeholders like [Your Name], just sign off as "Calnza Team".`
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response format from Anthropic');
  } catch (error) {
    console.error('[AI_DRAFT_ERROR]', error);
    // Fallback to simple template
    return `Dear ${quotation.name},\n\nThank you for reaching out to Calnza. We are pleased to provide you with the bulk order quotation for ${quotation.company || 'your inquiry'}.\n\nPlease find the details in the attached PDF. Our team is available to discuss any specific requirements or customizations you may need.\n\nBest regards,\nCalnza Team`;
  }
}
