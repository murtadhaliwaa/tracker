export const REWARD_ACCENT = "#f0c040";

export const REWARD_XP_PRESETS = [50, 100, 250, 500, 1000, 2500] as const;

export const REWARD_EMOJI_CATEGORIES = [
  {
    id: "treats",
    emojis: ["🎁", "🏆", "🎉", "🎊", "🎈", "🎀", "💝", "🧸", "🎮", "🎯"],
  },
  {
    id: "food",
    emojis: ["🍕", "🍔", "🍰", "☕", "🍿", "🍦", "🧁", "🍩", "🍜", "🥤", "🍣", "🌮"],
  },
  {
    id: "fun",
    emojis: ["🎬", "🎵", "🎸", "📺", "🎧", "🎭", "🎨", "📚", "🃏", "🎲", "🕹️", "🎤"],
  },
  {
    id: "travel",
    emojis: ["✈️", "🏖️", "🏕️", "🗺️", "🚗", "🛳️", "🏔️", "🌴", "🎡", "⛺", "🧳", "🚂"],
  },
  {
    id: "wellness",
    emojis: ["💆", "🧖", "🛁", "💤", "🧘", "🌸", "🕯️", "💅", "🧴", "🪷", "😴", "🛋️"],
  },
  {
    id: "luxury",
    emojis: ["💎", "👑", "🛍️", "💳", "⌚", "👟", "🧥", "🍾", "🥂", "💰", "🏠", "🚙"],
  },
] as const;

export const REWARD_EMOJIS = [
  ...new Set(REWARD_EMOJI_CATEGORIES.flatMap((category) => category.emojis)),
];

export type RewardEmojiCategoryId = (typeof REWARD_EMOJI_CATEGORIES)[number]["id"];

export type RewardFormValues = {
  id?: string;
  title: string;
  description: string;
  xpCost: number;
  emoji: string;
};

export const emptyRewardForm: RewardFormValues = {
  title: "",
  description: "",
  xpCost: 100,
  emoji: "🎁",
};
