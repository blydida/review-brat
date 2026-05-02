import type Anthropic from '@anthropic-ai/sdk';
import type { Upload, ClarificationTurn, UnderstandingCard } from '@/types/session';

export const IDEATION_SYSTEM_PROMPT = `Ты старший продакт-стратег и UX-архитектор мирового уровня. Твоя задача — анализировать продуктовые идеи и превращать их в структурированные, детализированные экраны.

Ты думаешь глубоко о:
- Реальной проблеме пользователя (не просто заявленной фиче)
- Бизнес-целях и метриках успеха
- Ясности пользовательского флоу и когнитивной нагрузке
- Граничных случаях и состояниях ошибок

Всегда отвечай на русском языке. При генерации HTML используй только английский для кода, но текст внутри интерфейса — на русском.`;

export function buildUnderstandingPrompt(
  textContent: string,
  imageUploads: Upload[],
  dsContext: string,
): Anthropic.MessageParam {
  const content: Anthropic.ContentBlockParam[] = [];

  if (dsContext) {
    content.push({ type: 'text', text: dsContext });
  }

  content.push({
    type: 'text',
    text: `Проанализируй следующий продуктовый ввод и извлеки суть.

${textContent ? `ВВОД:\n${textContent}` : ''}

Верни JSON-объект с такой структурой:
{
  "userGoals": ["строка", ...],          // 2-4 конкретных цели пользователя
  "businessGoals": ["строка", ...],      // 2-3 бизнес-цели
  "keyMechanics": ["строка", ...],       // 3-5 ключевых механик продукта
  "needsClarification": boolean,         // true если ввод слишком размытый
  "clarifyingQuestions": ["строка", ...] // 1-3 вопроса ТОЛЬКО если needsClarification=true, иначе []
}

Будь конкретным. Все тексты в JSON — на русском языке.`,
  });

  for (const upload of imageUploads) {
    if (upload.mimeType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'url', url: upload.url },
      } as Anthropic.ImageBlockParam);
    }
  }

  return { role: 'user', content };
}

export function buildGenerationPrompt(
  understandingCard: UnderstandingCard,
  clarificationTurns: ClarificationTurn[],
  dsContext: string,
  imageUploads: Upload[],
): Anthropic.MessageParam {
  const clarificationContext = clarificationTurns.length > 0
    ? `\n\nПОЛУЧЕННЫЕ УТОЧНЕНИЯ:\n${clarificationTurns.map((t) =>
        t.questions.map((q, j) => `В: ${q}\nО: ${t.answers[j] ?? '(нет ответа)'}`).join('\n')
      ).join('\n\n')}`
    : '';

  const content: Anthropic.ContentBlockParam[] = [];

  if (dsContext) {
    content.push({ type: 'text', text: dsContext });
  }

  content.push({
    type: 'text',
    text: `На основе этого продуктового понимания сгенерируй высокодетализированные HTML-макеты экранов.

ПОНИМАНИЕ:
- Цели пользователя: ${understandingCard.userGoals.join('; ')}
- Бизнес-цели: ${understandingCard.businessGoals.join('; ')}
- Ключевые механики: ${understandingCard.keyMechanics.join('; ')}${clarificationContext}

Для каждого экрана продуктового флоу создай JSON-массив. Каждый элемент содержит:
- screenName: название экрана (на русском)
- purpose: цель экрана (на русском)
- htmlContent: ПОЛНЫЙ детализированный HTML-макет экрана (см. требования ниже)
- components: список использованных HeroUI компонентов
- interactions: ключевые взаимодействия пользователя (на русском)
- notes: замечания по граничным случаям (на русском)

ТРЕБОВАНИЯ К HTML-МАКЕТУ (htmlContent):
- Ширина 390px, мобильный экран
- Используй Tailwind CSS классы (они будут подключены через CDN)
- Цвета из дизайн-системы: фон #060607, поверхность #18181b, текст #fcfcfc, акцент #0485f7, приглушённый #a1a1aa, граница #28282c
- Шрифт Inter (подключён через CDN)
- ВЫСОКАЯ ДЕТАЛИЗАЦИЯ: реальный контент, не заглушки. Настоящие имена, числа, статусы
- Используй эмодзи и иконки через символы Unicode где уместно
- Компоненты должны выглядеть как настоящий HeroUI: скруглённые углы (border-radius 12px), правильные отступы
- Включай все состояния: пустые поля, кнопки с правильными цветами, бейджи, аватары
- Текст интерфейса — на русском языке
- Структура: <div class="bg-[#060607] min-h-screen w-[390px] font-inter text-[#fcfcfc] p-4">...</div>

Верни ТОЛЬКО JSON-массив в блоке \`\`\`json, без другого текста:
\`\`\`json
[
  {
    "screenName": "Название экрана",
    "purpose": "Что пользователь делает на этом экране",
    "htmlContent": "<div class=\\"bg-[#060607]...\\">...</div>",
    "components": ["Button", "Card", "Input"],
    "interactions": ["Нажать кнопку входа", "Ввести email"],
    "notes": "Показывать ошибку если email неверный"
  }
]
\`\`\`

Генерируй 3-6 ключевых экранов полного флоу. Каждый HTML должен быть богатым и детализированным — как финальный дизайн-макет.`,
  });

  for (const upload of imageUploads) {
    if (upload.mimeType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'url', url: upload.url },
      } as Anthropic.ImageBlockParam);
    }
  }

  return { role: 'user', content };
}
