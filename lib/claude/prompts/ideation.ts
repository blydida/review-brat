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
- Ширина 390px, мобильный экран, тёмная тема
- Tailwind CSS доступен через CDN, шрифт Inter подключён
- ВЫСОКАЯ ДЕТАЛИЗАЦИЯ: реальный контент, не "Название" или "Текст". Настоящие имена, числа, данные
- Текст интерфейса — на русском языке
- Обёртка: <div class="bg-[#060607] min-h-screen w-[390px] font-sans text-[#fcfcfc] overflow-hidden">

ОБЯЗАТЕЛЬНЫЕ ПАТТЕРНЫ HEROUI-КОМПОНЕНТОВ (используй точно такую структуру):

Button (primary): <button class="w-full bg-[#0485f7] hover:bg-[#3592f9] text-white font-semibold text-sm py-3 px-6 rounded-xl transition-colors">Текст</button>
Button (secondary): <button class="w-full bg-[#232325] text-[#fcfcfc] font-medium text-sm py-3 px-6 rounded-xl border border-[#28282c]">Текст</button>
Button (ghost): <button class="text-[#0485f7] font-medium text-sm py-2 px-4">Текст</button>

Card: <div class="bg-[#18181b] rounded-2xl p-4 border border-[#28282c]">...</div>
Card с тенью: <div class="bg-[#18181b] rounded-2xl p-4 shadow-lg">...</div>

Input: <div class="bg-[#18181b] rounded-xl px-4 py-3 border border-[#28282c] flex items-center gap-3"><span class="text-[#a1a1aa] text-sm">🔍</span><input class="bg-transparent text-sm text-[#fcfcfc] placeholder-[#71717a] outline-none flex-1" placeholder="Поиск..."/></div>

Chip/Badge (default): <span class="bg-[#232325] text-[#a1a1aa] text-xs font-medium px-3 py-1 rounded-full">Тег</span>
Chip (accent): <span class="bg-[#0485f7]/20 text-[#0485f7] text-xs font-medium px-3 py-1 rounded-full">Активный</span>
Chip (success): <span class="bg-[#17c964]/20 text-[#17c964] text-xs font-medium px-3 py-1 rounded-full">Готово</span>
Chip (danger): <span class="bg-[#db3b3e]/20 text-[#db3b3e] text-xs font-medium px-3 py-1 rounded-full">Ошибка</span>

Avatar: <div class="w-10 h-10 rounded-full bg-[#0485f7] flex items-center justify-center text-white font-semibold text-sm shrink-0">АБ</div>
Avatar (lg): <div class="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">ИМ</div>

Navbar: <nav class="bg-[#060607] px-4 py-3 flex items-center justify-between border-b border-[#28282c]"><span class="font-semibold">Заголовок</span><button class="text-[#a1a1aa]">⚙️</button></nav>

Tab bar (bottom): <div class="fixed bottom-0 left-0 right-0 bg-[#18181b] border-t border-[#28282c] flex"><button class="flex-1 py-3 flex flex-col items-center gap-1 text-[#0485f7]"><span>🏠</span><span class="text-[10px]">Главная</span></button><button class="flex-1 py-3 flex flex-col items-center gap-1 text-[#a1a1aa]"><span>🔍</span><span class="text-[10px]">Поиск</span></button></div>

Divider: <div class="border-t border-[#28282c] my-3"></div>

List item: <div class="flex items-center gap-3 py-3 border-b border-[#28282c]/50 last:border-0">...</div>

Progress bar: <div class="bg-[#232325] rounded-full h-1.5"><div class="bg-[#0485f7] h-1.5 rounded-full" style="width:65%"></div></div>

СТРУКТУРА ЭКРАНА (всегда):
1. Navbar или header зона сверху
2. Основной контент (прокручиваемый)
3. Нижняя навигация или CTA кнопка внизу если нужно
Контент должен быть плотным — заполняй весь экран реальными данными

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
