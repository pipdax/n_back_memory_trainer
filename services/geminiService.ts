import { GoogleGenAI, Type } from "@google/genai";

// Ensure this environment variable is set in your deployment environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generatePrompt = (category: string) => `
请为儿童记忆游戏生成一个包含20个常见“${category}”的有效JSON数组。
数组中的每个对象都必须包含三个属性:
1. "name": 一个字符串，包含项目的中文名称 (例如, "狮子")。
2. "type": 一个字符串。如果类别是'形状'或'符号'，则为'SHAPE'。对于所有其他类别（如动物、食物、物品、自然、旅行地点、运动、服装），则为'EMOJI'。
3. "emoji": 一个字符串, 包含一个与项目相关的单个表情符号 (例如, "🦁")。

不要在JSON数组之外包含任何文本、解释或markdown格式。
输出应该是一个单一的、原始的JSON数组。
`;

const createAnalysisPrompt = (rawJson: string, category: string) => `
你是一位为3-16岁儿童记忆游戏设计的内容审查专家。我会提供一个JSON数组，其中包含了游戏资源。
你的任务是审查、修正并验证这个JSON数据。请严格遵守以下规则：

1.  **儿童安全**: 确保所有项目（名称和表情符号）都绝对适合儿童，没有任何不当、暴力或恐怖内容。移除任何不合适的项目。
2.  **准确性**: 修正名称和表情符号不匹配的问题。例如，如果 "猫" 的表情是 "🐶"，请将其修正为 "🐱"。
3.  **类型一致性**: "type" 属性的值必须与类别 "${category}" 匹配。
    - 如果类别是'形状'或'符号'，"type" 必须是 'SHAPE'。
    - 对于所有其他类别（如动物、食物、物品、自然等），"type" 必须是 'EMOJI'。
    请修正任何不一致的地方。
4.  **格式要求**: 最终输出必须是一个格式完美的、纯粹的JSON数组。不要包含任何额外的文字、解释、注释或markdown标记。

以下是需要审查的JSON数据:
${rawJson}
`;


const itemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'The name of the item.' },
        type: { type: Type.STRING, description: 'The type of the stimulus.' },
        emoji: { type: Type.STRING, description: 'A single emoji representing the item.' },
    },
    required: ["name", "type", "emoji"]
};

/*
 * =============================================================================
 *  开发者提示: 查找并添加新资源
 * =============================================================================
 * 本文件使用 Gemini API 动态获取新资源。如需手动扩展 `constants.ts` 文件
 * 中的 `INITIAL_RESOURCES`，以下是一些有用的网站和方法。
 *
 * 表情符号 (Emojis):
 * - Emojipedia: https://emojipedia.org/ - 所有表情符号的权威来源。
 * - Full Emoji List: https://unicode.org/emoji/charts/full-emoji-list.html
 *
 * 颜色 (Colors):
 * - 中国色: http://zhongguose.com/ - 一个很好的中国传统颜色资源站。
 * - Coolors: https://coolors.co/ - 强大的调色板生成器。
 * - HTML Color Codes: https://htmlcolorcodes.com/
 *
 * 形状 (Shapes - Unicode):
 * - Unicode 几何图形: https://www.w3.org/TR/xml-entity-names/025.html
 * - 杂项符号: https://www.compart.com/en/unicode/block/U+2600
 *
 * 图标 (Icons - 可作为形状或图片的替代品):
 * - Font Awesome: https://fontawesome.com/
 * - Google Material Icons: https://fonts.google.com/icons
 *
 * 图片 (Images):
 * - Unsplash / Pexels: 用于高质量、免费使用的照片。
 * - The Noun Project: https://thenounproject.com/ - 提供各种事物的简洁图标。
 * - Picsum Photos: https://picsum.photos/ - 本项目中用于生成占位符图片。
 *   URL 格式为 `https://picsum.photos/seed/{某个独特的字符串}/200`。
 *
 * 添加资源时，请确保内容适合儿童年龄段 (3-16岁)。
 * =============================================================================
 */
type ResourceItem = {name: string; type: string; emoji: string};

const analyzeAndCorrectResources = async (rawJson: string, category: string): Promise<ResourceItem[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: createAnalysisPrompt(rawJson, category),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: itemSchema
                }
            }
        });

        const correctedJsonText = response.text.trim();
        const correctedItems = JSON.parse(correctedJsonText);

        if (!Array.isArray(correctedItems)) {
            throw new Error("AI analysis response was not a JSON array.");
        }
        return correctedItems;

    } catch (error) {
        console.error("Error during AI analysis and correction:", error);
        throw new Error("AI 校验资源失败。");
    }
}

export const fetchNewResources = async (category: string): Promise<ResourceItem[]> => {
    if (!API_KEY) {
        throw new Error("Gemini API 密钥未配置。");
    }
    
    try {
        // Step 1: Generate initial resources
        const generationResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: generatePrompt(category),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: itemSchema
                }
            }
        });
        
        const rawJsonText = generationResponse.text.trim();

        // Step 2: Analyze and correct the generated resources
        const correctedItems = await analyzeAndCorrectResources(rawJsonText, category);
        
        return correctedItems;

    } catch (error) {
        console.error("Error fetching and correcting resources from Gemini API:", error);
        const errorMessage = (error as Error).message || "一个未知错误发生了。";
        throw new Error(`从 AI 获取新资源失败: ${errorMessage}`);
    }
};