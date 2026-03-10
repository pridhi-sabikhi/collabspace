const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const COMMAND_PROMPTS = {
  summarize: 'Summarize the following text concisely:',
  fix_grammar: 'Fix the grammar and spelling in the following text, returning only the corrected text:',
  translate: 'Translate the following text to English (if already English, translate to Spanish):',
  explain: 'Explain the following text in simple terms:',
  expand: 'Expand on the following text with more detail and depth:',
  make_shorter: 'Make the following text shorter while keeping the key meaning:',
};

exports.runCommand = async (req, res) => {
  try {
    const { selectedText, command } = req.body;

    if (!selectedText || !command) {
      return res.status(400).json({ message: 'selectedText and command are required' });
    }

    const prompt = COMMAND_PROMPTS[command];
    if (!prompt) {
      return res.status(400).json({ message: 'Invalid command' });
    }

    const result = await model.generateContent(
      `You are a helpful writing assistant.\n\n${prompt}\n\n${selectedText}`
    );

    const response = result.response.text();
    res.json({ result: response });
  } catch (err) {
    console.error('AI command error:', err.message);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({ message: 'AI rate limit reached. Please wait a minute and try again.' });
    }
    res.status(500).json({ message: 'AI processing failed: ' + err.message });
  }
};

exports.generateOutline = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const result = await model.generateContent(
      `You are a helpful writing assistant. Generate a document outline as valid TipTap JSON. The JSON should have type "doc" at root with content array containing heading and paragraph nodes. Use heading nodes with attrs.level for H1/H2/H3 and paragraph nodes with text content for descriptions.\n\nGenerate a detailed document outline for the topic: "${topic}". Return ONLY valid JSON in TipTap format, no markdown code fences, no explanation.`
    );

    let text = result.response.text().trim();
    // Strip code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(text);
    res.json({ result: parsed });
  } catch (err) {
    console.error('AI outline error:', err.message);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({ message: 'AI rate limit reached. Please wait a minute and try again.' });
    }
    res.status(500).json({ message: 'AI outline generation failed' });
  }
};