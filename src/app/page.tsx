"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// 256 multilingual AI-generation prompts
// 30% EN, 10% ZH, 10% JA, 10% KO, 10% FR, 5% EL, 5% RU, 5% AR, 5% ES, 5% IT, 5% DE
// ─────────────────────────────────────────────────────────────────────────────
const PROMPTS: string[] = [
    // ── English (77) ──────────────────────────────────────────────────────────
    "A lone astronaut floating through a nebula of rose-gold dust",
    "Hyper-realistic portrait of an elderly fisherman at golden hour",
    "A futuristic Tokyo street market at midnight, neon rain",
    "Macro photograph of dew drops on a spider web at sunrise",
    "Ancient library with floating glowing books in a misty hall",
    "A wolf made entirely of northern lights aurora",
    "Black-and-white street photography, New York 1960s, rain-soaked",
    "Bioluminescent forest at night, ethereal blue glow",
    "Vintage Japanese woodblock print of Mount Fuji at sunset",
    "A stone cathedral turned into a greenhouse, vines and light",
    "Close-up of a hummingbird in flight, iridescent feathers",
    "Deep sea creature photo, bioluminescent, ultra-realistic",
    "Surrealist painting: giant clocks melting over a desert",
    "Neo-noir detective office, green lamp, film grain texture",
    "A dragon made of ocean waves crashing at shore",
    "Concept art: floating island city above cloud layer",
    "Portrait of a cyberpunk samurai, chrome armor, neon streets",
    "Oil paint style: child blowing dandelion seeds in summer wind",
    "Moody architecture photo: brutalist concrete tower at dusk",
    "Orbital view of Earth during a category-5 hurricane spiral",
    "Watercolor painting of Venice canal during aqua alta flood",
    "Mechanical clock intricate gears macro, warm brass tones",
    "An ice palace shaped like a blooming lotus flower",
    "Abandoned amusement park overgrown with jungle vegetation",
    "Realistic illustration: red fox sitting in snow at dusk",
    "Digital glitch art portrait with VHS scan lines and noise",
    "A lighthouse during a violent storm, long exposure photography",
    "Fashion editorial: model in haute couture in Sahara desert",
    "Cinematic still: steam train on a mountain bridge at dawn",
    "Ancient Roman ruins submerged in crystal-clear Mediterranean water",
    "A cat wearing a tiny crown, regal oil painting Baroque style",
    "Double exposure: woman's silhouette and dense redwood forest",
    "Close-up of a cherry blossom petal floating on dark water",
    "Intricate mandala formed from microscopic diatoms",
    "Cyber-organic city where buildings breathe and pulse with light",
    "Golden ratio spiral rendered as a blooming sunflower",
    "Minimalist product photo: floating glass perfume bottle",
    "Ethereal portrait: woman with smoke and butterflies in hair",
    "Isometric illustration of a cozy autumn bookshop at night",
    "High-speed photo of milk crown splash, studio lighting",
    "Portrait of a Norse god carved in living ice, stormy sky",
    "A galaxy shaped like a giant human eye looking at you",
    "Infrared photography: white trees against black sky meadow",
    "Concept car rendered in liquid chrome on obsidian surface",
    "A phoenix rising from embers of a burning manuscript",
    "Topographic map of an alien planet rendered in pastel",
    "Cinematic wide-angle: explorer in a cavern with beam of light",
    "Futuristic fashion: metallic bio-suit with neural interface",
    "Engraving style: mechanical heart with exposed clockwork",
    "A river of liquid gold running through a dark canyon at night",
    "Stained glass window depicting a data center and AI server racks",
    "Bokeh forest path at golden hour from low angle",
    "Geometric abstract: shifting hexagons in coral reef palette",
    "Robotic hand cradling a fragile soap bubble",
    "Surrealist: upside-down waterfall rising into a floating lake",
    "Silhouette of a violinist against a blood-moon eclipse",
    "Photorealistic mushroom colony glowing blue in fog",
    "Magazine cover: retro-futurism 1960s space race propaganda",
    "Cross-section of a beehive rendered as architectural blueprint",
    "Timelapse composite of a city square over 24 hours, light trails",
    "Illustration: a koi fish morphing into a dragon mid-leap",
    "Black marble texture with pure white lightning bolt veins",
    "Close-up of an eye reflecting a city on fire at night",
    "Baroque painting: feast of gods with robotic servants",
    "Concept art: post-ice-age civilization living inside glaciers",
    "Moss-covered Japanese stone lanterns along a fog-filled path",
    "Flat-design vector: world map formed from migration bird trails",
    "Dramatic still life: overripe fruit, moths, memento mori style",
    "Infrared aerial view of Amazon rainforest at peak summer",
    "Neon-lit karaoke bar, empty 3 AM, rain on the window",
    "Sand sculpture of a medieval knight by crashing waves",
    "A white horse at full gallop through a lavender field",
    "Satellite thermal imaging false-color of a volcanic island",
    "Impressionist seascape: violent purple storm approaching harbor",
    "Ink wash painting of a lone samurai on a cliff overlooking sea",
    "A glass sphere containing a miniature galaxy",

    // ── Chinese 中文 (26) ──────────────────────────────────────────────────────
    "山水之间一位独行僧侣，水墨风格，简约空灵",
    "赛博朋克上海夜市，霓虹招牌，雨中倒影",
    "巨型红色锦鲤在云霄中飞翔，传统工笔彩绘",
    "古典园林中的仕女，汉服飘动，荷花池边",
    "废墟中生长的参天竹林，遗忘之地，薄雾弥漫",
    "一只熊猫坐在竹林月光下读书，温馨写意",
    "丝绸之路黄昏，驼队剪影，漫天星河",
    "祁连山脉冰川鸟瞰，淡蓝色冰裂纹",
    "木质茶馆内两位老者对弈，光影穿越竹帘",
    "中国神话：哪吒踏风火轮穿越暴风云海",
    "水墨风格：黄山奇松在云瀑中沐浴阳光",
    "传统年画风格：财神爷在繁华市集中巡游",
    "未来主义长安城：悬浮宫殿与飞龙并存",
    "春节夜晚：万家灯火，远山影，烟火盛放",
    "汉代石室壁画：神兽玄武守护北方天门",
    "广东渔港清晨：渔船如织，白鹭掠过平静水面",
    "苗族少女盛装节庆：银饰华光，歌声回荡山谷",
    "深海巨龙沉睡于珊瑚宫殿，碧波荡漾",
    "中秋月圆：嫦娥抚琴，玉兔于桂树下沉思",
    "敦煌飞天壁画数字复原，金色线条，穿越时空",
    "微型盆景世界：蓬莱仙岛尽在方寸之间",
    "古代造纸坊工序全景，工匠专注如画",
    "夜雨时分的成都小巷，油纸伞点点，市声渺渺",
    "极简主义：一枝红梅立于白雪地上，留白意境",
    "神秘东方炼丹炉，红光氤氲，仙鹤盘旋",
    "桂林山水长卷：雨后烟波，渔翁垂钓",

    // ── Japanese 日本語 (26) ───────────────────────────────────────────────────
    "桜吹雪の中を歩く着物姿の女性、水彩画スタイル",
    "サイバーパンク京都：竹を纏ったビルと提灯",
    "嵐山の竹林に差し込む朝日、深い霧の中",
    "忍者が雷雨の中で夜の城壁を駆け抜ける",
    "昭和レトロ食堂の夜、温かい光と湯気",
    "龍神が満月の波間で踊る、墨絵スタイル",
    "廃墟となった神社に咲く藤、静寂と再生",
    "東京の深夜ラーメン屋、雨の滴る路地",
    "江戸時代の花火師が打ち上げる巨大花火",
    "マクロ撮影：庭石の苔に宿る小さな宇宙",
    "ロボットが茶道の点前をする静かな茶室",
    "桂離宮の池に反射する紅葉と朝霧",
    "海辺の鳥居、波しぶき、強風に揺れる注連縄",
    "フューチャリスト：飛鳥の宮殿が宇宙に浮かぶ",
    "夕暮れの漁港：一艘の木造船と橙の空",
    "深海に沈む平安時代の都市遺跡",
    "達磨大師が雪嵐の中座禅する巨大岩の上",
    "アニメ調：魔法使いの少女が光の川を渡る",
    "百鬼夜行：妖怪たちの賑やかな夜の行列",
    "紙垂が揺れる神聖な杜、木漏れ日の朝",
    "現代の歌舞伎：舞台はネオン輝く宇宙ステーション",
    "蛍が乱舞する里山の夏夜、しっとりとした空気",
    "白狐が雪原を駆ける月夜の幻想画",
    "繊細な折り紙で作られた大きな鶴の群れ",
    "縄文土器の文様をモチーフにした抽象デジタルアート",
    "海女が潜る龍宮城、色鮮やかな珊瑚礁",

    // ── Korean 한국어 (26) ─────────────────────────────────────────────────────
    "한복 입은 여인이 달빛 아래 장독대에서 기도하는 모습",
    "사이버펑크 서울 강남: 네온 간판, 빗속의 군중",
    "자개 칠기함 위 섬세한 봉황 문양, 클로즈업",
    "제주 오름의 한라산 일출, 안개 속 영롱한 빛",
    "조선시대 천문대 첨성대와 별이 흐르는 밤하늘",
    "백두산 천지 위에 드리운 신비로운 구름",
    "거대한 고려청자 항아리가 현대 미술관에 전시된 장면",
    "해인사 팔만대장경판전 복도, 고요한 황금빛 저녁",
    "K-팝 세계관: 홀로그램 무대 위의 AI 가수",
    "단청 문양을 모티프로 한 추상 디지털 아트",
    "안동 하회마을 한옥들, 가을 낙엽과 반영된 수면",
    "삼성혈에서 탄생하는 세 신인의 신화적 장면",
    "바다 속 유물로 발견된 조선 귀선(거북선) 잔해",
    "먹그림 스타일: 백록담 정상의 겨울 설경",
    "가야금 연주자가 달빛 가득한 누각에서 연주하는 모습",
    "전통 시장: 새벽빛 속 색깔 소쿠리가 즐비한 5일장",
    "청동기 시대 고인돌 제단, 별빛 쏟아지는 새벽",
    "두꺼비 연적과 붓, 서예가의 손과 먹향 가득한 서재",
    "비단에 수놓은 십장생 그림의 세밀화 스타일",
    "강화도 돌담길을 걷는 스님, 가을 낙엽 흩날리는",
    "경복궁 근정전 대설 후, 눈 덮인 지붕과 하늘",
    "AI 로봇이 도자기를 굽는 현대 요장(窯場) 풍경",
    "북극광 아래 한국식 아이글루 마을, 순록 떼",
    "궁중 무용: 처용무 공연, 역동적인 붉은 의상",
    "솔향 가득한 설악산 공룡능선 여명의 실루엣",
    "미래 서울: 한강 위 유리 다리, 도시 위를 나는 드론 택시",

    // ── French (26) ───────────────────────────────────────────────────────────
    "Portrait expressionniste d'une danseuse de l'Opéra de Paris dans les coulisses",
    "Photographie de rue nocturne à Montmartre sous une pluie battante",
    "Vieux café parisien vide au petit matin, reflets sur les carreaux",
    "Impressionnisme : lavande en fleur en Provence au lever du soleil",
    "Illustration Art Nouveau : femme et vignes entrelacées",
    "Plongée dans les catacombes de Paris, lueur de bougie",
    "Marché provençal coloré, fleurs, épices et tisanes",
    "Château médiéval perché sur une falaise bretonne, brumes marines",
    "Aquarelle : bateaux de pêche dans le port de Concarneau",
    "Mode haute couture dans les ruines d'un château de la Loire",
    "Vue aérienne du vignoble bordelais en automne doré",
    "Scène surréaliste : la tour Eiffel entourée de requins en lévitation",
    "Illustration rétro : affiche de voyage pour la Côte d'Azur 1930s",
    "Photographie wildlife : renard roux dans les blés de Beauce",
    "Cour intérieure du Louvre sous un ciel d'orage dramatique",
    "Portrait baroque d'un alchimiste provençal en laboratoire",
    "Aquarelle douce : enfants au bord de la Seine un dimanche",
    "Boudoir de style Louis XV en macro : dorures et velours",
    "Panorama glacé : Alpes françaises vues du Mont-Blanc au lever du jour",
    "Typographie illustrée : calligramme de Verlaine en forêt",
    "Festival médiéval : joutes et troubadours en Avignon",
    "Image thermique d'un vignoble alsacien après le gel",
    "Dessin technique : coupe anatomique d'une rose de jardin",
    "Vue sous-marine des herbiers de Poséidonie en Méditerranée",
    "Concept art : ville-bulle sous la mer du Nord en 2150",
    "Illustration botanique : herbier de plantes sauvages des Cévennes",

    // ── Greek Ελληνικά (13) ────────────────────────────────────────────────────
    "Ηλιοβασίλεμα στη Σαντορίνη, κυκλαδική αρχιτεκτονική, ζεστά χρώματα",
    "Αρχαία αγορά Αθηνών αναστηλωμένη ψηφιακά, μπλε ουρανός",
    "Αγγειογραφία ερυθρόμορφη: ο Αχιλλέας βάφει ασπίδα",
    "Μινωική Κνωσός σε ψηφιδωτό χρώμα, αιγαιακό φως",
    "Ψαράς με τρεχάμενο στεφάνι αλιεύει στο Αιγαίο, πρωινή ομίχλη",
    "Κόρη αρχαϊκή ανθρωπίνης κλίμακας, σε μουσείο νύχτας",
    "Μυθολογικό τοπίο: ο Ποσειδώνας κινεί με τρίαινα τη θάλασσα",
    "Μακέτα αρχιτεκτονικής: Νέα Ακρόπολη 2100 σε αιωρούμενο βράχο",
    "Σπήλαιο Αντίπαρου, σταλαγμίτες φωτισμένοι σε μωβ",
    "Σύγχρονη ελληνική ταβέρνα, μεταλλική τέντα, ζεστό βράδυ",
    "Παραδοσιακή κουκλοθεατρική σκηνή Καραγκιόζη, σκιά και φλόγα",
    "Τοπίο Μετεώρων: υδατογραφία με σύννεφα και μοναστήρια",
    "Σχέδιο βοτανικό: βότανα του Ελληνικού κήπου σε σέπια τόνους",

    // ── Russian Русский (13) ───────────────────────────────────────────────────
    "Зимний Петербург: Нева в инее, Адмиралтейство в тумане",
    "Жар-птица в полёте над сибирской тайгой в рассветных лучах",
    "Русская деревня в снегу, тёплый свет избы, деревья в куржаке",
    "Портрет казачьего атамана в стиле передвижников XIX века",
    "Байкал зимой: прозрачный лёд с пузырьками, подводный свет",
    "Кремлёвские башни в грозу, молнии над куполами",
    "Русский балет: прима-балерина на сцене, прожектор сверху",
    "Матрёшка в разрезе: внутри — целые вселенные",
    "Сибирский тигр в снежном лесу, паровое дыхание",
    "Ярмарка на Масленицу: хоровод, самовар, блины в огне",
    "Авангардный плакат СССР 1925 года: серп, шестерни, будущее",
    "Заброшенная советская ракетная шахта в степи, рассвет",
    "Акварельный пейзаж: Карелия, озеро, сосны, серебро воды",

    // ── Arabic العربية (13) ────────────────────────────────────────────────────
    "مدينة بغداد القديمة تُعاد إلى رونقها الذهبي، رسم رقمي دقيق",
    "صقر صحراوي يحلق فوق الربع الخالي، غروب نارونج",
    "سوق مراكش القديم، ألوان البهارات والزرابي الملونة",
    "خط عربي ذهبي على خلفية لازوردية، بسملة فنية",
    "قصر الحمراء في غرناطة ليلاً، انعكاس المياه النقية",
    "رجل صحراوي بكوفية تلف حوله رمال الغبار الليلية",
    "مسجد الشيخ زايد من الأعلى، نمط هندسي رائع",
    "أمسية رمضانية، فانوس ذهبي، نجوم وطاولة مد البصر",
    "ناقة ملكية بزينة التراث والحلي الخليجية التقليدية",
    "آثار البتراء تحت ضوء القمر، ألوان الصخر الوردية",
    "خريطة تاريخية مزخرفة لطريق الحرير، ألوان الذهب والأحمر",
    "قارب خشبي تقليدي في الخليج، انعكاسات ماء هادئة",
    "فارس عربي يركض عبر حقول القمح الذهبية عند الفجر",

    // ── Spanish (13) ──────────────────────────────────────────────────────────
    "Bailaora de flamenco en un callejón de Sevilla, papel picado",
    "Gaudi Park Güell al atardecer, mosaicos y colores vibrantes",
    "Patagonia tempestuosa: los Torres del Paine entre niebla",
    "Mercado de la Boqueria: derroche de color, fruta y mariscos",
    "Machu Picchu al amanecer envuelto en nubes de montaña",
    "Ilustración retro: cartel de toros años 50, tipografía Art Deco",
    "Galaxia de la Vía Láctea sobre los salares de Atacama",
    "Retrato en óleo: conquistador español con armadura renacentista",
    "Arquitectura colonial en Cartagena de Indias al mediodía",
    "Desierto de Sonora al crepúsculo: saguaros y cielo naranja",
    "Concepto urbano: Madrid del año 2120, aeromóviles y jardines",
    "Fotografía submarina: los cenotes de Yucatán, haces de luz",
    "Pintura naïf de una aldea andina en el día de fiesta",

    // ── Italian (13) ──────────────────────────────────────────────────────────
    "Venezia al mattino presto: nebbia sul Canal Grande, gondola solitaria",
    "Affreschi rinascimentali della Cappella Sistina, dettaglio digitale",
    "Piazza Navona di notte, luci calde e fontana del Bernini",
    "Vigneto toscano in autunno: colori dorati, cipressi e nebbia",
    "Moda italiana haute couture su sfondo di marmo di Carrara",
    "Ritratto barocco: nobile veneziana con maschera del Carnevale",
    "Pompei: ricostruzione digitale vivida del foro all'epoca della gloria",
    "Amalfitana: scogliere a picco sul mare, barche colorate",
    "Antiquariato: dettaglio macro di un violino Stradivari",
    "Trattoria di campagna: focaccia fragrante sul tavolo rustico",
    "Futurismo italiano: composizione dinamica, velocità e macchine",
    "Colosseo di notte illuminato, nebbia storica romantica",
    "Illustrazione botanica: erbe aromatiche mediterranee su carta invecchiata",

    // ── German (13) ───────────────────────────────────────────────────────────
    "Schloss Neuschwanstein im Winterschnee, dramatisches Abendlicht",
    "Bauhaus-Poster neugestaltet: Geometrie und Primärfarben",
    "Hamburger Speicherstadt im Regen, Backstein und Spiegelungen",
    "Oktoberfest-Illustration: Festzelt, Maßkrüge, buntes Treiben",
    "Schwarzwaldlandschaft im Nebel, Fichten und rotes Reh",
    "Berliner Überalterung: Zebrastreifen mit U-Bahn-Lichtern",
    "Rügen-Kreidefelsen: dramatische Klippen über blauem Ostseewasser",
    "Meisterwerk Öl: Grimms Märchenwald mit Hexenhaus im Mondlicht",
    "Technisches Zeichnung-Stil: Motor eines 1950er Porsche im Querschnitt",
    "Wissenschaftskunst: Quantencomputer in flüssigem Stickstoff",
    "Kölner Dom-Silhouette beim Rheinhochwasser, Spiegelung im Wasser",
    "Futuristische Autobahn A8: selbstfahrende Pods in Platinfarbe",
    "Röntgenstil: Blütenkelch einer Königin Elisabeth Rose, ultradetailliert",
];

// Shuffle prompts so languages are interspersed (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
// Note: shuffle happens client-side only (in useEffect) to avoid SSR hydration mismatch
// caused by Math.random() producing different results on server vs client.


interface CellState {
    text: string;
    displayLen: number;    // how many chars are currently shown
    promptIdx: number;     // which prompt from PROMPTS
    phase: "typing" | "pausing" | "erasing";
    pauseTick: number;
}

function initCell(index: number): CellState {
    return {
        text: PROMPTS[index % PROMPTS.length],
        displayLen: 0,
        promptIdx: index % PROMPTS.length,
        phase: "typing",
        pauseTick: 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types and helpers
// ─────────────────────────────────────────────────────────────────────────────
const GRID = 16; // 16×16 = 256 cells
// ─────────────────────────────────────────────────────────────────────────────
// Cell renderer (pure, no state — driven by parent via canvas-like approach)
// ─────────────────────────────────────────────────────────────────────────────
function TextMatrixCell({ text, displayLen }: { text: string; displayLen: number }) {
    const shown = text.slice(0, displayLen);
    return (
        <div className="matrix-cell overflow-hidden px-2 py-1.5 text-[9px] leading-[1.3] font-mono text-white/20 whitespace-pre-wrap break-all select-none">
            {shown}
            {displayLen < text.length && (
                // Slim 1px cursor: width=1px, height=0.85em, opacity 30%
                <span className="cursor-blink inline-block align-middle bg-white/30 ml-[1px]"
                    style={{ width: '1px', height: '0.85em', verticalAlign: 'text-bottom' }}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    const [artColor, setArtColor] = useState("text-blue-400");

    useEffect(() => {
        const colors = [
            "text-blue-500 dark:text-blue-400",
            "text-emerald-500 dark:text-emerald-400",
            "text-amber-500 dark:text-amber-400",
            "text-purple-500 dark:text-purple-400",
            "text-rose-500 dark:text-rose-400",
        ];
        setArtColor(colors[Math.floor(Math.random() * colors.length)]);
    }, []);

    // All 256 cell states — initialized deterministically (no Math.random) so SSR matches client
    const cellsRef = useRef<CellState[]>(
        Array.from({ length: GRID * GRID }, (_, i) => ({
            text: PROMPTS[i % PROMPTS.length],
            displayLen: 0,
            promptIdx: i % PROMPTS.length,
            phase: "typing" as const,
            pauseTick: 0,
        }))
    );
    const renderCountRef = useRef(0);
    const frameRef = useRef<number | null>(null);

    // Per-cell animation speeds
    const TYPING_SPEED = 3;
    const ERASE_SPEED = 5;
    const PAUSE_TICKS = 40;
    const tickRef = useRef(0);
    // Trigger React re-renders from the RAF loop
    const [, setRenderTick] = useState(0);

    // Client-only init: shuffle + stagger (safe from hydration because it runs after mount)
    useEffect(() => {
        const shuffled = shuffle(PROMPTS);
        cellsRef.current.forEach((cell, i) => {
            cell.text = shuffled[i % shuffled.length];
            cell.promptIdx = i % shuffled.length;
            cell.displayLen = Math.floor(Math.random() * cell.text.length);
            cell.phase = Math.random() > 0.6 ? "pausing" : "typing";
        });
    }, []); // runs once after first paint — no SSR conflict

    useEffect(() => {
        let lastTime = 0;
        const MS_PER_FRAME = 50; // ~20fps for the text matrix (smooth but cheap)

        const tick = (now: number) => {
            if (now - lastTime < MS_PER_FRAME) {
                frameRef.current = requestAnimationFrame(tick);
                return;
            }
            lastTime = now;
            tickRef.current++;

            const cells = cellsRef.current;
            let anyChanged = false;

            cells.forEach((cell, i) => {
                // Stagger: not all cells update every frame
                if ((i + tickRef.current) % (2 + (i % 3)) !== 0) return;

                const prev = { ...cell };

                if (cell.phase === "typing") {
                    cell.displayLen = Math.min(cell.displayLen + TYPING_SPEED, cell.text.length);
                    if (cell.displayLen >= cell.text.length) {
                        cell.phase = "pausing";
                        cell.pauseTick = 0;
                    }
                } else if (cell.phase === "pausing") {
                    cell.pauseTick++;
                    if (cell.pauseTick >= PAUSE_TICKS) {
                        cell.phase = "erasing";
                    }
                } else if (cell.phase === "erasing") {
                    cell.displayLen = Math.max(0, cell.displayLen - ERASE_SPEED);
                    if (cell.displayLen === 0) {
                        // Rotate to next — order was shuffled at mount time in cellsRef
                        const nextIdx = (cell.promptIdx + 1) % PROMPTS.length;
                        cell.promptIdx = nextIdx;
                        cell.text = PROMPTS[nextIdx];
                        cell.phase = "typing";
                    }
                }

                if (cell.displayLen !== prev.displayLen || cell.phase !== prev.phase) {
                    anyChanged = true;
                }
            });

            if (anyChanged) setRenderTick((n: number) => n + 1);
            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [setRenderTick]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
            {/* ─── Animated text matrix background ─── */}
            <div
                className="absolute inset-0 grid"
                style={{
                    gridTemplateColumns: `repeat(${GRID}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID}, 1fr)`,
                }}
            >
                {cellsRef.current.map((cell, i) => (
                    <TextMatrixCell
                        key={i}
                        text={cell.text}
                        displayLen={cell.displayLen}
                    />
                ))}
            </div>

            {/* ─── Radial gradient overlay — lighter so matrix is visible ─── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    // Center: 0.64 opacity (was 0.55) | Edge: 0.22 opacity (was 0.18)
                    background:
                        "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(0,0,0,0.64) 0%, rgba(0,0,0,0.22) 100%)",
                }}
            />

            {/* ─── Centre hero card ─── */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[520px]">
                {/* Logo — matches header style exactly */}
                <h1 className="font-mono text-5xl sm:text-6xl tracking-tight leading-none mb-4 select-none">
                    <span className="font-bold text-white">P</span>
                    <span className={`opacity-40 font-normal transition-colors duration-1000 ${artColor}`}>rompt</span>
                    <span className="font-bold text-white">Flow.</span>
                    <span className={`font-bold transition-colors duration-1000 ${artColor}`}>art</span>
                </h1>

                {/* Slogan */}
                <p className="text-sm sm:text-base text-white/60 font-sans leading-relaxed max-w-[380px] mb-10">
                    Craft, iterate, and track your AI generation concepts using&nbsp;
                    <span className="text-white/90">structured expert templates.</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <Link
                        href="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95"
                    >
                        <LogIn className="h-4 w-4" />
                        Sign In
                    </Link>
                    <Link
                        href="/login?tab=register"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                    </Link>
                </div>
            </div>

            <style jsx global>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink {
          animation: cursor-blink 0.9s steps(1) infinite;
        }
      `}</style>
        </div>
    );
}
