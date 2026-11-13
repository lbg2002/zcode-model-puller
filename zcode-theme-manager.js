/**
 * ZCode Theme Manager - Chinese Classical Aesthetics & Line-Art Edition (v2.0.0)
 * Opt-in, renderer-only Chinese theme overlays, traditional白描 line-art drawings,
 * corner fretwork ornaments, custom slots, and JSON import/export.
 * Preserves the official theme preference and does not access provider data.
 * MIT. Part of lbg2002/zcode-model-puller Linux extension.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const VERSION = '2.0.0';
  const STORAGE_KEY = 'zcode-puller-theme-v1';
  const SLOTS_STORAGE_KEY = 'zcode-puller-theme-slots-v1';
  const LEGACY_COLOR_KEYS = ['background', 'sidebar', 'panel', 'card', 'foreground', 'accent', 'border'];
  const EXTRA_COLOR_KEYS = ['keyword', 'function', 'string', 'comment', 'selection', 'cursor'];
  const COLOR_KEYS = [...LEGACY_COLOR_KEYS, ...EXTRA_COLOR_KEYS];
  const LABELS = {
    background: '宣纸 / 主背景',
    sidebar: '立轴 / 侧边栏',
    panel: '轩窗 / 面板顶栏',
    card: '笺纸 / 卡片容器',
    foreground: '松烟 / 正文文字',
    accent: '朱砂 / 强调主色',
    border: '阑干 / 边框线条',
    keyword: '语法 · 关键字',
    function: '语法 · 函数名',
    string: '语法 · 字符串',
    comment: '语法 · 批注注释',
    selection: '语法 · 选中背景',
    cursor: '语法 · 毫端光标',
  };

  // Map legacy v1.x Western preset IDs to their Chinese counterparts for seamless migration
  const LEGACY_PRESET_MAP = Object.freeze({
    'tokyo-night': 'zi-jin-zhu-qiang',
    'catppuccin-mocha': 'dun-huang-fei-tian',
    'github-dimmed': 'jiang-nan-yan-yu',
    'nord': 'song-yan-chen-xiang',
    'solarized-light': 'ru-yao-tian-qing',
    'paper': 'xuan-zhi-shu-juan',
  });

  // 100% Classical Chinese Aesthetic Presets (6 Dark + 4 Light)
  const PRESETS = Object.freeze({
    'mo-yun-han-xiang': {
      name: '墨韵寒香',
      desc: '玄青水墨 · 朱砂点梅与石青',
      poem: '疏影横斜水清浅，暗香浮动月黄昏',
      tag: '水墨暗色',
      mode: 'dark',
      pattern: 'mei-zhu',
      ornament: 'hui-wen',
      colors: {
        background: '#181C1D',
        sidebar: '#222627',
        panel: '#222627',
        card: '#2A2F30',
        foreground: '#E6E6E6',
        accent: '#E35C58',
        border: '#3A4142',
        keyword: '#E35C58',
        function: '#5C92B5',
        string: '#C4A671',
        comment: '#747B81',
        selection: '#3A4750',
        cursor: '#FFFFFF',
      },
    },
    'qian-li-jiang-shan': {
      name: '千里江山',
      desc: '青绿重彩 · 矿石绿与泥金绢本',
      poem: '江山千里望无垠，元气淋漓障犹湿',
      tag: '青绿暗色',
      mode: 'dark',
      pattern: 'shan-shui',
      ornament: 'hui-wen',
      colors: {
        background: '#252321',
        sidebar: '#1E1C1B',
        panel: '#1E1C1B',
        card: '#2B2724',
        foreground: '#F0E9D1',
        accent: '#5CB390',
        border: '#403933',
        keyword: '#5CB390',
        function: '#4A859E',
        string: '#DDAA55',
        comment: '#7C8770',
        selection: '#4D3E29',
        cursor: '#E58A3B',
      },
    },
    'zi-jin-zhu-qiang': {
      name: '紫禁朱墙',
      desc: '宫墙丹漆 · 琉璃金瓦与玄夜',
      poem: '金阙晓钟开万户，玉阶仙仗拥千官',
      tag: '宫廷暗色',
      mode: 'dark',
      pattern: 'chuang-hua',
      ornament: 'hui-wen',
      colors: {
        background: '#1D1718',
        sidebar: '#151112',
        panel: '#261E20',
        card: '#2E2426',
        foreground: '#F2E8DF',
        accent: '#D8524B',
        border: '#473538',
        keyword: '#E06B64',
        function: '#E5B35A',
        string: '#74B396',
        comment: '#8E7A7C',
        selection: '#4A2B2D',
        cursor: '#F2E8DF',
      },
    },
    'dun-huang-fei-tian': {
      name: '敦煌飞天',
      desc: '莫高窟影 · 赭石泥金与石绿',
      poem: '大漠孤烟凝壁彩，飞天曳带落天花',
      tag: '壁画暗色',
      mode: 'dark',
      pattern: 'xiang-yun',
      ornament: 'hui-wen',
      colors: {
        background: '#211B17',
        sidebar: '#191411',
        panel: '#2B231E',
        card: '#332923',
        foreground: '#EFE3D2',
        accent: '#DF7A4E',
        border: '#4A3B31',
        keyword: '#E5A952',
        function: '#6BA1C4',
        string: '#69B08B',
        comment: '#8F7E70',
        selection: '#493628',
        cursor: '#F5D6A7',
      },
    },
    'jiang-nan-yan-yu': {
      name: '江南烟雨',
      desc: '青砖黛瓦 · 烟雨朦胧与荷青',
      poem: '春水碧于天，画船听雨眠',
      tag: '黛瓦暗色',
      mode: 'dark',
      pattern: 'shui-bo',
      ornament: 'shuang-xian',
      colors: {
        background: '#1C2226',
        sidebar: '#161B1E',
        panel: '#242C31',
        card: '#2B343A',
        foreground: '#DAE3E8',
        accent: '#5FA8A0',
        border: '#3B474F',
        keyword: '#D48893',
        function: '#6EA4C8',
        string: '#8BB882',
        comment: '#788994',
        selection: '#2F434A',
        cursor: '#DAE3E8',
      },
    },
    'song-yan-chen-xiang': {
      name: '松烟沉香',
      desc: '寒松古墨 · 沉香木与冷玉青',
      poem: '松风吹解带，山月照弹琴',
      tag: '文房暗色',
      mode: 'dark',
      pattern: 'song-feng',
      ornament: 'shuang-xian',
      colors: {
        background: '#1D201D',
        sidebar: '#161916',
        panel: '#262A26',
        card: '#2E332E',
        foreground: '#E2E8E1',
        accent: '#76AA92',
        border: '#3D453D',
        keyword: '#76AA92',
        function: '#78A5B3',
        string: '#C8A46E',
        comment: '#7D887C',
        selection: '#334239',
        cursor: '#E2E8E1',
      },
    },
    'qing-hua-ci-ying': {
      name: '青花瓷影',
      desc: '瓷白与霁蓝 · 清雅明亮',
      poem: '白釉青花一火成，花从釉里透分明',
      tag: '古瓷浅色',
      mode: 'light',
      pattern: 'xiang-yun',
      ornament: 'hui-wen',
      colors: {
        background: '#FAFAFA',
        sidebar: '#F2F4F5',
        panel: '#F2F4F5',
        card: '#FFFFFF',
        foreground: '#1C2A39',
        accent: '#295C9D',
        border: '#DCE3E8',
        keyword: '#295C9D',
        function: '#1F83A3',
        string: '#C25E73',
        comment: '#889AA8',
        selection: '#D4E4F0',
        cursor: '#1C2A39',
      },
    },
    'xuan-zhi-shu-juan': {
      name: '宣纸书卷',
      desc: '泾县宣纸 · 松烟墨字与朱印',
      poem: '书卷多情似故人，晨昏忧乐每相亲',
      tag: '书卷浅色',
      mode: 'light',
      pattern: 'song-feng',
      ornament: 'shuang-xian',
      colors: {
        background: '#FAF6EE',
        sidebar: '#F0EAE0',
        panel: '#FDFBF6',
        card: '#FFFDF9',
        foreground: '#26221E',
        accent: '#C03F3C',
        border: '#DED5C5',
        keyword: '#B53835',
        function: '#2C5E8A',
        string: '#367A5E',
        comment: '#8A8072',
        selection: '#EFE2D0',
        cursor: '#26221E',
      },
    },
    'ru-yao-tian-qing': {
      name: '汝窑天青',
      desc: '雨过天青 · 冰裂纹釉与素肌玉骨',
      poem: '雨过天青云破处，这般颜色做将来',
      tag: '宋瓷浅色',
      mode: 'light',
      pattern: 'chuang-hua',
      ornament: 'hui-wen',
      colors: {
        background: '#F2F6F5',
        sidebar: '#E4ECEA',
        panel: '#F7FAFA',
        card: '#FFFFFF',
        foreground: '#203132',
        accent: '#3A8279',
        border: '#CADAD7',
        keyword: '#286B63',
        function: '#2E6E91',
        string: '#B35847',
        comment: '#738A88',
        selection: '#D5E7E4',
        cursor: '#203132',
      },
    },
    'yu-lu-ming-cha': {
      name: '玉露茗茶',
      desc: '狮峰新茗 · 嫩芽茶汤与竹影清风',
      poem: '竹下忘言对紫茶，全胜羽客醉流霞',
      tag: '春茗浅色',
      mode: 'light',
      pattern: 'mei-zhu',
      ornament: 'shuang-xian',
      colors: {
        background: '#F5F7F2',
        sidebar: '#E8EFE2',
        panel: '#FAFBF8',
        card: '#FFFFFF',
        foreground: '#223025',
        accent: '#488A57',
        border: '#CFDCD0',
        keyword: '#3A7848',
        function: '#35748D',
        string: '#BA7B32',
        comment: '#778A7A',
        selection: '#D7E8D8',
        cursor: '#223025',
      },
    },
  });

  // Traditional Chinese Line-Art Drawings (白描勾勒意境画)
  const PATTERNS = Object.freeze({
    'shan-shui': {
      name: '远山云水',
      desc: '宋式白描层峦、流云与江舟水波',
      seal: '山河',
      renderMain: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" fill="none">
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 265 Q110 150 210 235 T395 165 T560 225 L635 190" stroke-width="1.8" opacity="0.72"/>
          <path d="M85 275 Q185 110 305 215 T515 125 L635 205" stroke-width="1.3" opacity="0.55"/>
          <path d="M220 280 Q335 165 445 245 T630 185" stroke-width="1.1" opacity="0.45"/>
          <circle cx="485" cy="68" r="24" stroke-width="1.4" opacity="0.62"/>
          <path d="M420 82 C445 72, 468 72, 495 80 C520 88, 548 86, 575 76" stroke-width="1.2" opacity="0.58"/>
          <path d="M135 96 C160 86, 185 88, 205 95 C228 102, 252 100, 275 90" stroke-width="1.1" opacity="0.42"/>
          <path d="M358 142 L375 125 L392 142 M363 142 L363 158 L387 158 L387 142" stroke-width="1.2" opacity="0.65"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.38">
          <path d="M40 282 Q130 274 220 282 T400 282 T580 282" stroke-width="1" stroke-dasharray="10 6"/>
          <path d="M90 292 Q190 285 290 292 T490 292" stroke-width="0.9" stroke-dasharray="6 8"/>
          <path d="M245 268 Q265 262 288 268 L280 273 L252 273 Z" stroke-width="1.1"/>
        </g>
      </svg>`,
      renderSidebar: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 420" fill="none">
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" opacity="0.68">
          <path d="M-10 380 Q65 270 145 350 T290 280" stroke-width="1.6"/>
          <path d="M15 405 Q105 295 195 365 T290 325" stroke-width="1.2" opacity="0.75"/>
          <circle cx="215" cy="195" r="16" stroke-width="1.2" opacity="0.6"/>
          <path d="M155 210 C180 202, 205 204, 235 212" stroke-width="1.1"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.35">
          <path d="M10 408 Q90 400 170 408 T275 408" stroke-width="1" stroke-dasharray="8 5"/>
        </g>
      </svg>`,
    },
    'mei-zhu': {
      name: '寒梅修竹',
      desc: '折枝寒梅、风竹疏影与五瓣梅萼白描',
      seal: '清雅',
      renderMain: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" fill="none">
        <g stroke="${fg}" stroke-linecap="round" stroke-linejoin="round" opacity="0.48">
          <path d="M635 265 C540 215, 455 160, 340 145 C275 136, 215 102, 165 65" stroke-width="2.1"/>
          <path d="M465 182 C425 140, 385 98, 330 68" stroke-width="1.4"/>
          <path d="M385 153 C345 185, 295 208, 240 218" stroke-width="1.2"/>
          <path d="M555 295 L575 40 M565 168 L585 168 M559 235 L579 235" stroke-width="1.5"/>
          <path d="M570 112 Q602 96 622 108 Q595 118 570 112 Z" stroke-width="1.1"/>
          <path d="M565 155 Q530 138 510 152 Q538 162 565 155 Z" stroke-width="1.1"/>
        </g>
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" opacity="0.82">
          <circle cx="340" cy="145" r="10" stroke-width="1.5"/>
          <circle cx="340" cy="131" r="6" stroke-width="1.2"/><circle cx="353" cy="140" r="6" stroke-width="1.2"/>
          <circle cx="348" cy="155" r="6" stroke-width="1.2"/><circle cx="332" cy="155" r="6" stroke-width="1.2"/>
          <circle cx="327" cy="140" r="6" stroke-width="1.2"/>
          <circle cx="242" cy="112" r="8" stroke-width="1.4"/>
          <circle cx="242" cy="100" r="5" stroke-width="1.1"/><circle cx="253" cy="108" r="5" stroke-width="1.1"/>
          <circle cx="249" cy="121" r="5" stroke-width="1.1"/><circle cx="235" cy="121" r="5" stroke-width="1.1"/>
          <circle cx="231" cy="108" r="5" stroke-width="1.1"/>
          <circle cx="330" cy="68" r="5" stroke-width="1.4"/>
          <circle cx="282" cy="198" r="4.5" stroke-width="1.3"/>
          <circle cx="192" cy="84" r="4" stroke-width="1.3"/>
        </g>
      </svg>`,
      renderSidebar: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 420" fill="none">
        <g stroke="${fg}" stroke-linecap="round" opacity="0.45">
          <path d="M0 365 C75 320, 145 265, 225 225" stroke-width="1.8"/>
          <path d="M105 305 C135 260, 165 225, 210 190" stroke-width="1.2"/>
          <path d="M38 420 L55 180 M44 300 L60 300" stroke-width="1.4"/>
          <path d="M50 240 Q82 225 98 236 Q74 246 50 240 Z" stroke-width="1.1"/>
        </g>
        <g stroke="${accent}" stroke-linecap="round" opacity="0.8">
          <circle cx="155" cy="262" r="7" stroke-width="1.4"/>
          <circle cx="155" cy="251" r="4.5" stroke-width="1.1"/><circle cx="165" cy="258" r="4.5" stroke-width="1.1"/>
          <circle cx="161" cy="269" r="4.5" stroke-width="1.1"/><circle cx="149" cy="269" r="4.5" stroke-width="1.1"/>
          <circle cx="145" cy="258" r="4.5" stroke-width="1.1"/>
          <circle cx="210" cy="190" r="4.5" stroke-width="1.3"/>
        </g>
      </svg>`,
    },
    'xiang-yun': {
      name: '祥云瑞鹤',
      desc: '敦煌卷草流云纹与仙鹤展翅勾线',
      seal: '瑞云',
      renderMain: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" fill="none">
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" opacity="0.72">
          <path d="M390 215 C365 215, 355 192, 378 184 C382 162, 415 158, 428 176 C448 164, 476 178, 468 200 C488 202, 488 222, 465 224 L375 224 C345 224, 325 238, 295 238" stroke-width="1.6"/>
          <path d="M402 200 C412 192, 426 196, 422 206 C418 212, 408 210, 410 203" stroke-width="1.3"/>
          <path d="M180 258 C160 258, 152 240, 170 234 C174 216, 200 214, 212 228 C228 220, 248 232, 242 248 L165 248 C140 248, 122 260, 95 260" stroke-width="1.4"/>
          <path d="M475 110 Q510 75 548 92 Q522 108 498 118 Q535 122 565 142 Q524 142 492 128 L452 145" stroke-width="1.5"/>
          <path d="M498 118 L468 96 L448 99" stroke-width="1.4"/>
          <path d="M310 88 Q338 62 368 75 Q348 88 328 96 Q356 99 380 115 Q348 115 322 104 L292 118" stroke-width="1.3"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.38">
          <path d="M250 165 C285 152, 325 152, 360 165" stroke-width="1.1" stroke-dasharray="8 6"/>
          <path d="M435 255 C485 242, 545 242, 595 255" stroke-width="1.1" stroke-dasharray="10 6"/>
        </g>
      </svg>`,
      renderSidebar: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 420" fill="none">
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" opacity="0.68">
          <path d="M65 355 C45 355, 38 335, 58 328 C62 310, 90 308, 102 322 C118 312, 142 324, 136 342 L55 342 C32 342, 18 354, 0 354" stroke-width="1.5"/>
          <path d="M145 265 Q175 238 205 250 Q185 262 165 270 Q195 274 218 288 Q186 288 160 278 L132 290" stroke-width="1.4"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.32">
          <path d="M30 388 C95 376, 165 376, 235 388" stroke-width="1" stroke-dasharray="8 6"/>
        </g>
      </svg>`,
    },
    'chuang-hua': {
      name: '轩窗回纹',
      desc: '江南园林海棠花窗、回字纹与汝窑冰裂纹',
      seal: '轩窗',
      renderMain: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" fill="none">
        <g stroke="${accent}" stroke-linecap="square" stroke-linejoin="miter" opacity="0.68">
          <rect x="430" y="70" width="160" height="160" rx="2" stroke-width="1.6"/>
          <rect x="438" y="78" width="144" height="144" rx="1" stroke-width="1"/>
          <path d="M438 150 H475 M545 150 H582 M510 78 V115 M510 185 V222" stroke-width="1.3"/>
          <polygon points="510,110 550,150 510,190 470,150" stroke-width="1.4"/>
          <circle cx="510" cy="150" r="18" stroke-width="1.2"/>
          <path d="M446 86 h22 v16 h-14 v-8 h6 M574 86 h-22 v16 h14 v-8 h-6 M446 214 h22 v-16 h-14 v8 h6 M574 214 h-22 v-16 h14 v8 h-6" stroke-width="1.2"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.36">
          <path d="M310 195 L355 165 L395 182 L430 150 M355 165 L342 120 L388 95 L430 112 M395 182 L382 238 L430 222" stroke-width="1"/>
          <path d="M250 245 L310 195 L335 255 L280 278 Z" stroke-width="1"/>
        </g>
      </svg>`,
      renderSidebar: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 420" fill="none">
        <g stroke="${accent}" stroke-linecap="square" opacity="0.65">
          <rect x="50" y="250" width="180" height="120" stroke-width="1.4"/>
          <polygon points="140,262 188,310 140,358 92,310" stroke-width="1.2"/>
          <circle cx="140" cy="310" r="16" stroke-width="1.1"/>
          <path d="M58 258 h18 v14 h-12 v-7 h5 M222 258 h-18 v14 h12 v-7 h-5 M58 362 h18 v-14 h-12 v7 h5 M222 362 h-18 v-14 h12 v7 h-5" stroke-width="1.1"/>
        </g>
        <g stroke="${fg}" opacity="0.3">
          <path d="M20 392 H260" stroke-width="1" stroke-dasharray="12 4"/>
        </g>
      </svg>`,
    },
    'shui-bo': {
      name: '曲水荷风',
      desc: '白描荷叶莲瓣、同心水波纹与双鲤戏水',
      seal: '听荷',
      renderMain: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" fill="none">
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" opacity="0.74">
          <path d="M470 220 C425 215, 395 185, 415 162 C435 142, 485 138, 525 152 C565 165, 578 198, 542 216 C518 228, 492 224, 470 220 Z" stroke-width="1.5"/>
          <path d="M482 186 L440 165 M482 186 L485 146 M482 186 L532 162 M482 186 L545 198 M482 186 L482 285" stroke-width="1.1"/>
          <path d="M355 175 C355 142, 372 118, 372 118 C372 118, 389 142, 389 175 Z" stroke-width="1.4"/>
          <path d="M355 175 C334 152, 336 128, 336 128 C354 136, 366 155, 372 175" stroke-width="1.3"/>
          <path d="M389 175 C410 152, 408 128, 408 128 C390 136, 378 155, 372 175" stroke-width="1.3"/>
          <path d="M372 175 L372 285" stroke-width="1.3"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.42">
          <ellipse cx="372" cy="255" rx="68" ry="14" stroke-width="1.1" stroke-dasharray="18 8"/>
          <ellipse cx="482" cy="265" rx="92" ry="18" stroke-width="1" stroke-dasharray="22 10"/>
          <path d="M245 235 Q272 222 296 235 Q272 248 245 235 Z M296 235 L312 226 M296 235 L312 244" stroke-width="1.2"/>
        </g>
      </svg>`,
      renderSidebar: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 420" fill="none">
        <g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round" opacity="0.7">
          <path d="M140 310 C140 278, 156 255, 156 255 C156 255, 172 278, 172 310 Z" stroke-width="1.4"/>
          <path d="M140 310 C122 290, 124 268, 124 268 C140 276, 150 292, 156 310" stroke-width="1.2"/>
          <path d="M172 310 C190 290, 188 268, 188 268 C172 276, 162 292, 156 310" stroke-width="1.2"/>
          <path d="M156 310 L156 395" stroke-width="1.2"/>
        </g>
        <g stroke="${fg}" stroke-linecap="round" opacity="0.38">
          <ellipse cx="156" cy="382" rx="75" ry="14" stroke-width="1" stroke-dasharray="14 8"/>
        </g>
      </svg>`,
    },
    'song-feng': {
      name: '松风琴韵',
      desc: '迎客苍松针叶、太湖石与七弦流水纹',
      seal: '松琴',
      renderMain: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" fill="none">
        <g stroke="${fg}" stroke-linecap="round" stroke-linejoin="round" opacity="0.48">
          <path d="M640 120 C560 125, 495 148, 425 135 C375 126, 335 145, 295 162" stroke-width="2.2"/>
          <path d="M495 138 C465 168, 425 188, 378 195" stroke-width="1.5"/>
          <path d="M520 295 L535 225 L568 205 L595 232 L615 295" stroke-width="1.4"/>
        </g>
        <g stroke="${accent}" stroke-linecap="round" opacity="0.76">
          <path d="M295 162 L272 145 M295 162 L268 158 M295 162 L274 172 M295 162 L285 140 M295 162 L305 142" stroke-width="1.3"/>
          <path d="M355 142 L332 124 M355 142 L328 138 M355 142 L336 152 M355 142 L348 120 M355 142 L368 122" stroke-width="1.3"/>
          <path d="M378 195 L354 180 M378 195 L352 194 M378 195 L360 208 M378 195 L372 175" stroke-width="1.2"/>
          <path d="M80 252 C210 232, 350 272, 490 250" stroke-width="1"/>
          <path d="M80 262 C210 242, 350 282, 490 260" stroke-width="1"/>
          <path d="M80 272 C210 252, 350 292, 490 270" stroke-width="1"/>
          <path d="M80 282 C210 262, 350 302, 490 280" stroke-width="1"/>
        </g>
      </svg>`,
      renderSidebar: (accent, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 420" fill="none">
        <g stroke="${fg}" stroke-linecap="round" opacity="0.45">
          <path d="M0 245 C65 250, 125 268, 195 255" stroke-width="1.9"/>
        </g>
        <g stroke="${accent}" stroke-linecap="round" opacity="0.72">
          <path d="M195 255 L218 238 M195 255 L222 252 M195 255 L215 266 M195 255 L204 234" stroke-width="1.3"/>
          <path d="M15 365 C95 350, 185 380, 265 365" stroke-width="1"/>
          <path d="M15 377 C95 362, 185 392, 265 377" stroke-width="1"/>
          <path d="M15 389 C95 374, 185 404, 265 389" stroke-width="1"/>
        </g>
      </svg>`,
    },
    'none': {
      name: '素面无纹',
      desc: '仅保留中式传统矿物配色，不绘制白描底纹',
      seal: '素心',
      renderMain: () => '',
      renderSidebar: () => '',
    },
  });

  const INK_LEVELS = Object.freeze({
    light: { name: '淡墨轻岚', opacity: '0.09' },
    medium: { name: '清墨雅致', opacity: '0.16' },
    strong: { name: '浓墨重彩', opacity: '0.26' },
  });

  const ORNAMENTS = Object.freeze({
    'hui-wen': { name: '回纹博古角花', desc: '卡片与弹窗四角呈现古典回纹装饰与朱印' },
    'shuang-xian': { name: '宋式双阑框线', desc: '古籍善本双线边框与卷轴装裱感' },
    'none': { name: '极简无框饰', desc: '仅保留现代干净的单线边框' },
  });

  const FONTS = Object.freeze({
    sans: {
      name: '思源黑体 · 清朗',
      stack: '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    },
    serif: {
      name: '思源宋体 · 书卷',
      stack: '"Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", "STSong", "SimSun", Georgia, serif',
    },
    kai: {
      name: '霞鹜楷体 · 雅集',
      stack: '"LXGW WenKai", "STKaiti", "Kaiti SC", "KaiTi", "Source Han Serif SC", serif',
    },
    system: {
      name: '系统原生 · 默认',
      stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans CJK SC", sans-serif',
    },
  });

  const DEFAULT_PRESET = 'mo-yun-han-xiang';
  const HEX = /^#[0-9a-f]{6}$/i;
  const root = document.documentElement;
  const isHex = (s) => typeof s === 'string' && HEX.test(s);
  const resolvePresetId = (id) => {
    if (typeof id !== 'string') return null;
    if (Object.prototype.hasOwnProperty.call(PRESETS, id)) return id;
    if (Object.prototype.hasOwnProperty.call(LEGACY_PRESET_MAP, id)) return LEGACY_PRESET_MAP[id];
    return null;
  };
  const clone = (p) => ({
    preset: p.preset,
    custom: Boolean(p.custom),
    pattern: p.pattern || PRESETS[p.preset]?.pattern || 'shan-shui',
    ink: p.ink || 'medium',
    ornament: p.ornament || PRESETS[p.preset]?.ornament || 'hui-wen',
    font: p.font || 'sans',
    colors: { ...p.colors },
  });

  const valid = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const resolvedId = resolvePresetId(obj.preset);
    if (!resolvedId) return null;
    const basePreset = PRESETS[resolvedId];
    const pattern = obj.pattern === undefined ? basePreset.pattern : (Object.prototype.hasOwnProperty.call(PATTERNS, obj.pattern) ? obj.pattern : null);
    const ink = obj.ink === undefined ? 'medium' : (Object.prototype.hasOwnProperty.call(INK_LEVELS, obj.ink) ? obj.ink : null);
    const ornament = obj.ornament === undefined ? basePreset.ornament : (Object.prototype.hasOwnProperty.call(ORNAMENTS, obj.ornament) ? obj.ornament : null);
    const font = obj.font === undefined ? 'sans' : (Object.prototype.hasOwnProperty.call(FONTS, obj.font) ? obj.font : null);
    if (!pattern || !ink || !ornament || !font) return null;

    if (obj.custom !== true) {
      return {
        preset: resolvedId,
        custom: false,
        pattern,
        ink,
        ornament,
        font,
        colors: { ...basePreset.colors },
      };
    }
    if (!obj.colors || LEGACY_COLOR_KEYS.some((key) => !isHex(obj.colors[key]))) return null;
    if (EXTRA_COLOR_KEYS.some((key) => obj.colors[key] !== undefined && !isHex(obj.colors[key]))) return null;
    return {
      preset: resolvedId,
      custom: true,
      pattern,
      ink,
      ornament,
      font,
      colors: Object.fromEntries(
        COLOR_KEYS.map((key) => [key, (obj.colors[key] ?? basePreset.colors[key]).toUpperCase()])
      ),
    };
  };

  const readStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? valid(JSON.parse(raw)) : null;
    } catch (_error) {
      return null;
    }
  };
  const persist = (p) => {
    try {
      if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      else localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (_error) {
      return false;
    }
  };

  const readSlots = () => {
    try {
      const raw = localStorage.getItem(SLOTS_STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((item) => item && typeof item.title === 'string' && valid(item.theme))
        .slice(0, 6)
        .map((item) => ({ title: item.title.slice(0, 24), theme: valid(item.theme) }));
    } catch (_error) {
      return [];
    }
  };
  const saveSlots = (slots) => {
    try {
      localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(slots.slice(0, 6)));
      return true;
    } catch (_error) {
      return false;
    }
  };

  const makePreset = (id) => {
    const resolved = resolvePresetId(id) || DEFAULT_PRESET;
    const p = PRESETS[resolved];
    return {
      preset: resolved,
      custom: false,
      pattern: p.pattern,
      ink: 'medium',
      ornament: p.ornament,
      font: 'sans',
      colors: { ...p.colors },
    };
  };

  let committed = readStored();
  let draft = null;
  let modal = null;
  let lastFocus = null;

  function svgToDataUri(svg) {
    if (!svg) return 'none';
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;
  }

  function cornerFretworkDataUri(accent) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
      <g stroke="${accent}" stroke-width="1.3" stroke-linecap="square" opacity="0.42">
        <path d="M4 26 V4 H26 M8 20 V8 H20 v6 h-6"/>
        <path d="M94 4 H116 V26 M100 8 H112 V20 h-6 v-6"/>
        <path d="M4 94 V116 H26 M8 100 V112 H20 v-6 h-6"/>
        <path d="M94 116 H116 V94 M100 112 H112 V100 h-6 v6"/>
      </g>
    </svg>`;
    return svgToDataUri(svg);
  }

  const tokens = `
    :root[data-zpt-theme-active="true"],
    html[data-zpt-theme-active="true"],
    html[data-zpt-theme-active="true"].dark,
    html[data-zpt-theme-active="true"].theme-zai-dark,
    html[data-zpt-theme-active="true"].theme-zai-light {
      --color-background: var(--zpt-background) !important;
      --color-background-alt: var(--zpt-sidebar) !important;
      --color-background-win-alt: var(--zpt-sidebar) !important;
      --color-sidebar: var(--zpt-sidebar) !important;
      --color-panel: var(--zpt-panel) !important;
      --color-header: var(--zpt-panel) !important;
      --color-surface: var(--zpt-card) !important;
      --color-surface-hover: var(--zpt-hover) !important;
      --color-hover: var(--zpt-hover) !important;
      --color-selected: var(--zpt-selected) !important;
      --color-card: var(--zpt-card) !important;
      --color-card-selected: var(--zpt-panel) !important;
      --color-card-border: var(--zpt-border) !important;
      --color-foreground: var(--zpt-foreground) !important;
      --color-foreground-subtle: var(--zpt-foreground-muted) !important;
      --color-foreground-subtlest: var(--zpt-foreground-subtlest) !important;
      --color-foreground-inverse: var(--zpt-background) !important;
      --color-remote-foreground-muted: var(--zpt-foreground-muted) !important;
      --color-muted-foreground: var(--zpt-foreground-muted) !important;
      --color-brand: var(--zpt-accent) !important;
      --color-primary: var(--zpt-accent) !important;
      --color-primary-foreground: var(--zpt-accent-contrast) !important;
      --color-secondary: var(--zpt-panel) !important;
      --color-icon-blue: var(--zpt-accent) !important;
      --color-resize-handle: var(--zpt-accent) !important;
      --color-ring: var(--zpt-accent) !important;
      --color-border: var(--zpt-border) !important;
      --color-border-hover: var(--zpt-accent) !important;
      --color-input: var(--zpt-panel) !important;
      --color-input-focused: var(--zpt-card) !important;
      --color-input-border: var(--zpt-border) !important;
      --color-input-border-hover: var(--zpt-accent) !important;
      --color-input-border-focused: var(--zpt-accent) !important;
      --color-accent: var(--zpt-highlight) !important;
      --color-sidebar-border: var(--zpt-border) !important;
      --color-sidebar-background: var(--zpt-sidebar) !important;
      --color-sidebar-foreground: var(--zpt-foreground) !important;
      --color-sidebar-accent: var(--zpt-selected) !important;
      --color-sidebar-accent-foreground: var(--zpt-foreground) !important;
      --color-sidebar-primary: var(--zpt-accent) !important;
      --color-sidebar-primary-foreground: var(--zpt-accent-contrast) !important;
      --color-popover: var(--zpt-card) !important;
      --color-popover-foreground: var(--zpt-foreground) !important;
      --color-popover-header: var(--zpt-panel) !important;
      --color-popover-border: var(--zpt-border) !important;
      --color-menu: var(--zpt-card) !important;
      --color-menu-hover: var(--zpt-hover) !important;
      --color-tab: var(--zpt-sidebar) !important;
      --color-tab-active: var(--zpt-card) !important;
      --color-tab-border: var(--zpt-border) !important;
      --color-tag: var(--zpt-panel) !important;
      --color-toast: var(--zpt-card) !important;
      --color-tooltip: var(--zpt-panel) !important;
      --color-tooltip-foreground: var(--zpt-foreground) !important;
      --color-tooltip-tag: var(--zpt-card) !important;
      --color-tooltip-tag-foreground: var(--zpt-foreground-muted) !important;
      --color-user-message-bubble: var(--zpt-highlight) !important;
      --color-terminal-bg: var(--zpt-background) !important;
      --color-terminal-fg: var(--zpt-foreground) !important;
      --color-terminal-cursor: var(--zpt-cursor) !important;
      --color-terminal-cursor-accent: var(--zpt-background) !important;
      --color-terminal-selection: var(--zpt-selection) !important;
      --color-text-primary: var(--zpt-foreground) !important;
      --color-text-secondary: var(--zpt-foreground-muted) !important;
      --color-code-keyword: var(--zpt-keyword) !important;
      --color-code-function: var(--zpt-function) !important;
      --color-code-string: var(--zpt-string) !important;
      --color-code-comment: var(--zpt-comment) !important;
      --color-selection: var(--zpt-selection) !important;
      --color-caret: var(--zpt-cursor) !important;
      --animated-gradient-text-strong: var(--zpt-foreground) !important;
      --animated-gradient-text-soft: var(--zpt-foreground-muted) !important;
      --zpt-radius: 6px;
      color-scheme: var(--zpt-scheme);
    }

    html[data-zpt-theme-active="true"] body {
      background-color: var(--zpt-background) !important;
      color: var(--zpt-foreground) !important;
      font-family: var(--zpt-font-ui, "Source Han Sans SC", "Noto Sans CJK SC", system-ui, sans-serif);
      scrollbar-color: var(--zpt-border) var(--zpt-background);
    }

    /* Outer shell & left sidebar full-coverage adaptation (both Workspace and Settings) */
    html[data-zpt-theme-active="true"] [data-desktop-window-frame="true"] {
      background-color: var(--zpt-sidebar) !important;
      color: var(--zpt-foreground) !important;
    }
    html[data-zpt-theme-active="true"] [data-zpt-shell-sidebar="true"],
    html[data-zpt-theme-active="true"] [data-workspace-sidebar-panel="true"],
    html[data-zpt-theme-active="true"] #sidebar,
    html[data-zpt-theme-active="true"] [data-active-section] > aside,
    html[data-zpt-theme-active="true"] [data-project-sidebar-panel="navigation"],
    html[data-zpt-theme-active="true"] [data-zpt-shell-sidebar="true"] > :is(div, aside, nav, section),
    html[data-zpt-theme-active="true"] [data-zpt-shell-sidebar="true"] :is(div, aside, nav, section):is([class*="bg-"], [data-slot*="sidebar"], [class*="sidebar"], [class*="Sidebar"]) {
      background-color: var(--zpt-sidebar) !important;
      border-color: var(--zpt-border) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) {
      color: var(--zpt-foreground) !important;
      border-right: 1px solid var(--zpt-border) !important;
      font-family: var(--zpt-font-ui, "Source Han Sans SC", "Noto Sans CJK SC", system-ui, sans-serif);
      background-image: var(--zpt-sidebar-art-image, none) !important;
      background-repeat: no-repeat !important;
      background-position: center bottom !important;
      background-size: 100% auto !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) :is(h1,h2,h3,h4,button,a,label,p,span,svg,[role="treeitem"],[role="listitem"]) {
      color: var(--zpt-foreground) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) :is(small,time,[id^="settings-sidebar-group-"],[class*="text-muted"],[class*="text-remote-foreground-muted"],[class*="text-foreground-subtle"],[class*="text-gray-"],[class*="text-slate-"],[class*="text-zinc-"],[class*="text-neutral-"]) {
      color: var(--zpt-foreground-muted) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) :is([class*="border-"],hr) {
      border-color: var(--zpt-border) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) [aria-label*="返回"],
    html[data-zpt-theme-active="true"] [data-active-section] > aside button.bg-surface {
      background-color: var(--zpt-card) !important;
      border: 1px solid var(--zpt-border) !important;
      color: var(--zpt-foreground) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) :is(button,a,[role="button"],[role="treeitem"],[role="listitem"]):hover {
      background-color: var(--zpt-hover) !important;
      color: var(--zpt-foreground) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) :is([aria-selected="true"],[aria-current="page"],[data-state="active"],[data-active="true"],.active,.selected) {
      background-color: var(--zpt-selected) !important;
      color: var(--zpt-foreground) !important;
      box-shadow: inset 3px 0 0 var(--zpt-accent) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-zpt-shell-sidebar="true"], [data-workspace-sidebar-panel="true"], #sidebar, [data-active-section] > aside) :is(input,textarea) {
      background-color: var(--zpt-card) !important;
      color: var(--zpt-foreground) !important;
      border-color: var(--zpt-border) !important;
    }

    /* Main content frame & Chinese line-art canvas overlay */
    html[data-zpt-theme-active="true"] :is([data-settings-panel-frame="true"], #content) {
      background-color: var(--zpt-background) !important;
      border-color: var(--zpt-border) !important;
    }
    #zpt-art-backdrop {
      position: fixed;
      right: 18px;
      bottom: 12px;
      width: min(540px, 46vw);
      height: min(255px, 34vh);
      pointer-events: none !important;
      user-select: none !important;
      z-index: 5;
      opacity: var(--zpt-art-opacity, 0.16);
      transition: opacity 0.25s ease;
      display: none;
    }
    html[data-zpt-theme-active="true"] #zpt-art-backdrop[data-has-art="true"] {
      display: block;
    }
    #zpt-art-backdrop svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Traditional Chinese Ornamentation Styles (回纹博古角花 / 宋式双阑框线) */
    html[data-zpt-theme-active="true"][data-zpt-theme-ornament="hui-wen"] :is([data-active-section] .bg-card, .zpt-dialog, .zpt-preview) {
      background-image: var(--zpt-corner-ornament, none);
      background-repeat: no-repeat;
      background-size: 100% 100%;
    }
    html[data-zpt-theme-active="true"][data-zpt-theme-ornament="shuang-xian"] :is([data-active-section] .bg-card, [data-settings-panel-frame="true"], .zpt-dialog, .zpt-preview) {
      box-shadow: inset 0 0 0 2px var(--zpt-card), inset 0 0 0 3px var(--zpt-border) !important;
    }

    /* Native controls (Switch, Select, Input) adaptation */
    html[data-zpt-theme-active="true"] [data-slot="switch"][data-state="checked"],
    html[data-zpt-theme-active="true"] [role="switch"][aria-checked="true"] {
      background-color: var(--zpt-accent) !important;
      border-color: var(--zpt-accent) !important;
    }
    html[data-zpt-theme-active="true"] [data-slot="switch"][data-state="unchecked"],
    html[data-zpt-theme-active="true"] [role="switch"][aria-checked="false"] {
      background-color: var(--zpt-border) !important;
    }
    html[data-zpt-theme-active="true"] [data-slot="switch-thumb"] {
      background-color: var(--zpt-accent-contrast) !important;
    }
    html[data-zpt-theme-active="true"] :is([data-slot="select-trigger"], input[type="number"], input[type="text"], input[type="search"]) {
      background-color: var(--zpt-panel) !important;
      color: var(--zpt-foreground) !important;
      border: 1px solid var(--zpt-border) !important;
    }

    html[data-zpt-theme-active="true"] :is([role="dialog"],[role="menu"],[role="listbox"],[data-slot="popover-content"]) {
      border-color: var(--zpt-border) !important;
    }
    html[data-zpt-theme-active="true"] :is([role="tab"],[data-zpt-shell-sidebar="true"] button) {
      border-radius: var(--zpt-radius) !important;
    }
    html[data-zpt-theme-active="true"] :is(input,textarea,[contenteditable="true"],.cm-content) {
      caret-color: var(--zpt-cursor) !important;
    }
    html[data-zpt-theme-active="true"] ::selection {
      background: var(--zpt-selection) !important;
      color: var(--zpt-foreground) !important;
    }
    /* Syntax tokens only for renderers with stable named token classes */
    html[data-zpt-theme-active="true"] :is(.hljs-keyword,.hljs-selector-tag,.token.keyword,.cm-keyword) { color: var(--zpt-keyword) !important; }
    html[data-zpt-theme-active="true"] :is(.hljs-title.function_,.hljs-title.class_,.token.function,.token.class-name,.cm-def) { color: var(--zpt-function) !important; }
    html[data-zpt-theme-active="true"] :is(.hljs-string,.token.string,.cm-string) { color: var(--zpt-string) !important; }
    html[data-zpt-theme-active="true"] :is(.hljs-comment,.token.comment,.cm-comment) { color: var(--zpt-comment) !important; font-style: italic; }
    html[data-zpt-theme-active="true"] :is(pre code,.hljs,.cm-content) { font-family: "JetBrains Mono","Fira Code",ui-monospace,monospace; }

    /* Make theme management dialog follow the selected Chinese palette */
    html[data-zpt-theme-active="true"] .zpt-overlay { color: var(--zpt-foreground); color-scheme: var(--zpt-scheme); }
    html[data-zpt-theme-active="true"] .zpt-dialog { background: var(--zpt-panel); border-color: var(--zpt-border); border-radius: 12px; }
    html[data-zpt-theme-active="true"] :is(.zpt-header,.zpt-footer,.zpt-editor,.zpt-art-studio,.zpt-io-box) { border-color: var(--zpt-border); }
    html[data-zpt-theme-active="true"] :is(.zpt-header h2,.zpt-heading,.zpt-color-row,.zpt-settings-title,.zpt-preset strong,.zpt-sub-label) { color: var(--zpt-foreground); }
    html[data-zpt-theme-active="true"] :is(.zpt-note,.zpt-preset small,.zpt-color-value,.zpt-status,.zpt-eyebrow,.zpt-settings-desc,.zpt-poem) { color: var(--zpt-foreground-muted); }
    html[data-zpt-theme-active="true"] :is(.zpt-editor,.zpt-art-studio,.zpt-preset,.zpt-chip,.zpt-btn,.zpt-close,#zpt-settings-open,.zpt-io-input) {
      background: var(--zpt-card); border-color: var(--zpt-border); color: var(--zpt-foreground);
    }
    html[data-zpt-theme-active="true"] :is(.zpt-preset:hover,.zpt-chip:hover) { border-color: var(--zpt-accent); }
    html[data-zpt-theme-active="true"] :is(.zpt-preset[aria-pressed="true"],.zpt-chip[aria-pressed="true"]) {
      border-color: var(--zpt-accent);
      box-shadow: inset 0 0 0 1px var(--zpt-accent);
    }
    html[data-zpt-theme-active="true"] .zpt-color-row input { background: var(--zpt-panel); border-color: var(--zpt-border); }
    html[data-zpt-theme-active="true"] .zpt-primary { background: var(--zpt-accent); color: var(--zpt-accent-contrast); border-color: var(--zpt-accent); }
    html[data-zpt-theme-active="true"] .zpt-preview { background: var(--preview-background); color: var(--preview-foreground); }

    /* Integrated in ZCode Settings > Appearance */
    #zpt-settings-row { padding: 14px 16px; border-top: 1px solid var(--color-border, #454d60); color: var(--color-foreground, #e6eaf4); }
    .zpt-settings-layout { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 16px; }
    .zpt-settings-title { display: flex; align-items: center; gap: 8px; font-size: var(--ui-font-size, 14px); font-weight: 600; line-height: 1.5; }
    .zpt-seal-badge { display: inline-flex; align-items: center; justify-content: center; padding: 1px 6px; font-size: 11px; font-weight: 700; color: #fff; background: #B83B36; border: 1px solid #E35C58; border-radius: 3px; letter-spacing: 0.08em; line-height: 1.4; }
    .zpt-settings-desc { margin-top: 4px; font-size: var(--ui-font-size, 14px); line-height: 1.6; color: var(--color-foreground-subtle, #9ca3af); }
    #zpt-settings-open { display: inline-flex; justify-content: center; align-items: center; gap: 7px; min-width: 192px; min-height: 36px; border-radius: 9px; padding: 6px 14px; border: 1px solid var(--color-border, #454d60); background: var(--color-surface, #293144); color: var(--color-foreground, #e6eaf4); font: inherit; cursor: pointer; transition: all 0.15s ease; }
    #zpt-settings-open:hover { background: var(--color-surface-hover, #343c50); border-color: var(--zpt-accent, #E35C58); }
    #zpt-settings-open:focus-visible { outline: 2px solid var(--color-brand, #E35C58); outline-offset: 2px; }
    #zpt-settings-open svg { flex: none; width: 16px; height: 16px; }
    @media (max-width: 590px) { .zpt-settings-layout { grid-template-columns: minmax(0,1fr); gap: 10px; } #zpt-settings-open { width: 100%; } }

    /* Modal Dialog Layout */
    .zpt-overlay, .zpt-overlay * { box-sizing: border-box; }
    .zpt-overlay { position: fixed; inset: 0; z-index: 950000; display: flex; align-items: center; justify-content: center; background: #000a; backdrop-filter: blur(8px); padding: 18px; font-family: var(--zpt-font-ui, system-ui, -apple-system, "Noto Sans CJK SC", sans-serif); color: #e6eaf4; }
    .zpt-dialog { width: min(980px, 100%); max-height: min(92vh, 880px); overflow: auto; background: #1c1918; border: 1px solid #483d39; border-radius: 16px; box-shadow: 0 30px 90px #000b; }
    .zpt-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding: 20px 26px 16px; border-bottom: 1px solid #38302d; }
    .zpt-eyebrow { display: flex; align-items: center; gap: 8px; color: #d87a68; font-size: 11px; font-weight: 700; letter-spacing: .12em; }
    .zpt-header h2 { color: #f6efe9; font-size: 20px; margin: 5px 0 5px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .zpt-note { color: #afa39a; font-size: 12px; line-height: 1.65; margin: 0; }
    .zpt-close { background: transparent; color: #cabeb4; border: 1px solid #4b403c; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 20px; }
    .zpt-content { display: grid; grid-template-columns: minmax(0, 1.38fr) minmax(300px, 1fr); gap: 20px; padding: 20px 26px; }
    .zpt-heading { display: flex; justify-content: space-between; align-items: center; color: #f0e6dd; font-weight: 650; font-size: 13px; margin: 0 0 10px; }
    .zpt-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .zpt-preset { position: relative; text-align: left; padding: 11px 12px; color: #efe7df; background: #26211f; border: 1px solid #463c38; border-radius: 10px; cursor: pointer; transition: border-color 0.15s ease, transform 0.12s ease; }
    .zpt-preset:hover { border-color: #c76b5a; transform: translateY(-1px); }
    .zpt-preset[aria-pressed="true"] { border-color: #e35c58; box-shadow: 0 0 0 1px #e35c58 inset; }
    .zpt-swatch { display: flex; overflow: hidden; border-radius: 5px; height: 28px; margin-bottom: 8px; border: 1px solid #ffffff21; }
    .zpt-swatch span { flex: 1; }
    .zpt-preset-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .zpt-preset strong { display: block; font-size: 12.5px; }
    .zpt-preset-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; border: 1px solid currentColor; opacity: 0.78; }
    .zpt-preset small { display: block; color: #b5a99f; font-size: 11px; margin-top: 3px; line-height: 1.4; }
    .zpt-poem { display: block; font-size: 10.5px; font-style: italic; margin-top: 3px; opacity: 0.75; }

    /* Chinese Line-Art Studio Section */
    .zpt-art-studio { margin-top: 14px; border-radius: 12px; background: #231e1c; border: 1px solid #433935; padding: 13px 14px; }
    .zpt-sub-group { margin-top: 10px; }
    .zpt-sub-group:first-child { margin-top: 0; }
    .zpt-sub-label { display: block; font-size: 11.5px; font-weight: 600; margin-bottom: 6px; color: #e2d6cc; }
    .zpt-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .zpt-chip { padding: 5px 10px; border-radius: 6px; border: 1px solid #4c413d; background: #2c2623; color: #e8ded5; font-size: 11.5px; cursor: pointer; transition: all 0.12s; }
    .zpt-chip[aria-pressed="true"] { border-color: #e35c58; font-weight: 600; }

    /* Saved Custom Slots & Import/Export */
    .zpt-slots-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 8px; }
    .zpt-slot-pill { display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; border: 1px solid var(--zpt-border, #4c413d); background: var(--zpt-card, #2c2623); padding: 3px 8px; font-size: 11px; color: inherit; cursor: pointer; }
    .zpt-slot-del { border: none; background: transparent; color: inherit; opacity: 0.65; cursor: pointer; padding: 0 2px; font-size: 12px; }
    .zpt-slot-del:hover { opacity: 1; color: #e35c58; }
    .zpt-io-box { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #463c38; display: none; gap: 8px; flex-direction: column; }
    .zpt-io-box[data-open="true"] { display: flex; }
    .zpt-io-input { width: 100%; min-height: 58px; padding: 7px 9px; border-radius: 6px; border: 1px solid #4c413d; background: #181514; color: #efe7df; font: 11px/1.45 ui-monospace, monospace; resize: vertical; }

    /* Fine Color Editor & Live Chinese Scroll Preview */
    .zpt-editor { border-radius: 12px; background: #231e1c; border: 1px solid #433935; padding: 14px; }
    .zpt-colors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 12px; }
    .zpt-color-row { display: flex; align-items: center; gap: 6px; justify-content: space-between; color: #dfd4ca; font-size: 11.5px; }
    .zpt-color-row input { width: 32px; height: 24px; padding: 1px; background: #302926; border: 1px solid #63554f; border-radius: 5px; cursor: pointer; }
    .zpt-color-value { min-width: 58px; text-align: right; font-size: 10.5px; color: #b5a69b; font-family: ui-monospace, monospace; }
    .zpt-preview { position: relative; overflow: hidden; border-radius: 10px; margin-top: 13px; border: 1px solid var(--preview-border); padding: 12px; color: var(--preview-foreground); background: var(--preview-background); }
    .zpt-preview-art { position: absolute; right: 4px; bottom: 2px; width: 72%; height: 82%; pointer-events: none; opacity: var(--preview-art-opacity, 0.22); }
    .zpt-preview-art svg { width: 100%; height: 100%; display: block; }
    .zpt-preview-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 11px; }
    .zpt-preview-dot { display: inline-block; width: 8px; height: 8px; background: var(--preview-accent); border-radius: 50%; margin-right: 5px; }
    .zpt-preview-seal { display: inline-block; padding: 1px 5px; font-size: 10px; font-weight: 700; color: #fff; background: #B83B36; border-radius: 2px; letter-spacing: 0.08em; }
    .zpt-preview-pane { position: relative; z-index: 1; display: flex; gap: 7px; margin-top: 10px; }
    .zpt-preview-sidebar { flex: 0 0 27%; min-height: 48px; padding: 6px; background: var(--preview-sidebar); border: 1px solid var(--preview-border); border-radius: 5px; font-size: 9.5px; display: flex; flex-direction: column; justify-content: space-between; }
    .zpt-preview-card { flex: 1; padding: 8px 10px; background: var(--preview-card); border: 1px solid var(--preview-border); border-radius: 5px; font-size: 10.5px; }
    .zpt-preview-btn { display: inline-block; background: var(--preview-accent); color: var(--preview-background); border-radius: 4px; margin-top: 5px; padding: 2px 7px; font-size: 10px; font-weight: 600; }
    .zpt-preview-code { position: relative; z-index: 1; margin-top: 8px; padding: 7px 9px; border: 1px solid var(--preview-border); border-radius: 4px; background: var(--preview-panel); color: var(--preview-foreground); font: 10px/1.55 "JetBrains Mono","Fira Code",monospace; white-space: nowrap; overflow: hidden; }
    .zpt-footer { padding: 14px 26px; border-top: 1px solid #38302d; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .zpt-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .zpt-btn { padding: 8px 13px; border-radius: 8px; border: 1px solid #5c4f49; background: #2c2522; color: #f2e9e1; cursor: pointer; font-weight: 600; font-size: 12px; }
    .zpt-btn:hover { filter: brightness(1.12); }
    .zpt-primary { background: #e35c58; color: #ffffff; border-color: #e35c58; }
    .zpt-reset { color: #d6c8bc; }
    .zpt-status { min-height: 15px; color: #b7a89d; font-size: 11px; }
    @media (max-width: 720px) { .zpt-dialog { max-height: 94vh; } .zpt-content { grid-template-columns: 1fr; padding: 14px; } .zpt-header { padding: 16px 14px 12px; } .zpt-footer { padding: 12px 14px; } .zpt-presets, .zpt-colors { grid-template-columns: 1fr; } }
  `;

  function setupCss() {
    if (document.getElementById('zpt-theme-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'zpt-theme-styles';
    sheet.textContent = tokens;
    (document.head || document.documentElement).appendChild(sheet);
  }

  const DERIVED_KEYS = [
    'foreground-muted',
    'foreground-subtlest',
    'highlight',
    'hover',
    'selected',
    'accent-contrast',
    'scheme',
    'art-opacity',
    'font-ui',
    'sidebar-art-image',
    'main-art-image',
    'corner-ornament',
  ];

  function relativeLuminance(hex) {
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const linear = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function contrastText(hex) {
    return relativeLuminance(hex) > 0.18 ? '#181C1D' : '#FFFFFF';
  }

  function effectiveMode(p) {
    if (!p) return 'dark';
    if (!p.custom && PRESETS[p.preset]) return PRESETS[p.preset].mode;
    return relativeLuminance(p.colors.background) > 0.35 ? 'light' : 'dark';
  }

  let shellSidebar = null;
  function mountShellTheme() {
    if (typeof document.querySelectorAll !== 'function') return;
    const screenW = window.innerWidth || root.clientWidth || 1440;
    const screenH = window.innerHeight || root.clientHeight || 900;
    if (screenW < 420) return;
    let best = null;
    let score = 0;
    const consider = (node) => {
      if (!node || typeof node.getBoundingClientRect !== 'function' || node.closest?.('.zpt-overlay')) return;
      const rect = node.getBoundingClientRect();
      // Support both standard sidebars (200-480px) and compact/scaled sidebars (64-175px)
      if (
        rect.left < -12 ||
        rect.left > 16 ||
        rect.top > 160 ||
        rect.width < 64 ||
        rect.width > Math.min(480, screenW * 0.48) ||
        rect.height < screenH * 0.52
      ) {
        return;
      }
      const s = rect.width * rect.height - Math.abs(rect.left) * 1000;
      if (s > score) {
        best = node;
        score = s;
      }
    };
    for (const node of document.querySelectorAll(
      '[data-workspace-sidebar-panel="true"],#sidebar,[data-active-section] > aside,aside,[data-sidebar],[data-slot*="sidebar"],[class*="sidebar"],[class*="Sidebar"]'
    )) {
      consider(node);
    }
    if (!best) {
      const base = document.getElementById('root') || document.getElementById('app') || document.body;
      const queue = [{ node: base, depth: 0 }];
      let checked = 0;
      while (queue.length && checked++ < 500) {
        const item = queue.shift();
        if (!item?.node || item.depth > 7) continue;
        consider(item.node);
        if (item.depth < 7 && item.node.children) {
          for (const child of item.node.children) queue.push({ node: child, depth: item.depth + 1 });
        }
      }
    }
    if (best === shellSidebar) return;
    if (shellSidebar?.removeAttribute) shellSidebar.removeAttribute('data-zpt-shell-sidebar');
    shellSidebar = best;
    if (best) best.setAttribute('data-zpt-shell-sidebar', 'true');
  }

  function updateArtBackdrop(p) {
    if (!document.body || typeof document.createElement !== 'function') return;
    let backdrop = document.getElementById('zpt-art-backdrop');
    if (!p || p.pattern === 'none' || !PATTERNS[p.pattern]) {
      if (backdrop) {
        backdrop.setAttribute('data-has-art', 'false');
        backdrop.innerHTML = '';
      }
      return;
    }
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'zpt-art-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
    const svg = PATTERNS[p.pattern].renderMain(p.colors.accent, p.colors.foreground);
    backdrop.innerHTML = svg;
    backdrop.setAttribute('data-has-art', svg ? 'true' : 'false');
  }

  function syncDocumentThemeClasses(mode) {
    if (!root.classList) return;
    if (!mode) {
      let official = null;
      try {
        official = localStorage.getItem('zcode-theme');
      } catch (_e) {}
      if (official === 'zai-light' || official === 'light') {
        root.classList.remove('dark', 'theme-zai-dark');
        root.classList.add('theme-zai-light');
      } else if (official === 'zai-dark' || official === 'dark') {
        root.classList.add('dark', 'theme-zai-dark');
        root.classList.remove('theme-zai-light');
      }
      return;
    }
    const isDark = mode === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('theme-zai-dark', isDark);
    root.classList.toggle('theme-zai-light', !isDark);
  }

  function applyTheme(p) {
    if (!p) {
      root.removeAttribute('data-zpt-theme-active');
      root.removeAttribute('data-zpt-theme-preset');
      root.removeAttribute('data-zpt-theme-mode');
      root.removeAttribute('data-zpt-theme-pattern');
      root.removeAttribute('data-zpt-theme-ornament');
      for (const key of [...COLOR_KEYS, ...DERIVED_KEYS]) root.style.removeProperty('--zpt-' + key);
      syncDocumentThemeClasses(null);
      updateArtBackdrop(null);
    } else {
      const mode = effectiveMode(p);
      const patternKey = PATTERNS[p.pattern] ? p.pattern : (PRESETS[p.preset]?.pattern || 'shan-shui');
      const inkKey = INK_LEVELS[p.ink] ? p.ink : 'medium';
      const ornamentKey = ORNAMENTS[p.ornament] ? p.ornament : (PRESETS[p.preset]?.ornament || 'hui-wen');
      const fontKey = FONTS[p.font] ? p.font : 'sans';

      for (const key of COLOR_KEYS) root.style.setProperty('--zpt-' + key, p.colors[key]);
      root.style.setProperty('--zpt-foreground-muted', p.colors.foreground + 'B8');
      root.style.setProperty('--zpt-foreground-subtlest', p.colors.foreground + '66');
      root.style.setProperty('--zpt-highlight', p.colors.accent + '22');
      root.style.setProperty('--zpt-hover', p.colors.accent + '18');
      root.style.setProperty('--zpt-selected', p.colors.accent + '28');
      root.style.setProperty('--zpt-accent-contrast', contrastText(p.colors.accent));
      root.style.setProperty('--zpt-scheme', mode);
      root.style.setProperty('--zpt-art-opacity', INK_LEVELS[inkKey].opacity);
      root.style.setProperty('--zpt-font-ui', FONTS[fontKey].stack);

      const mainSvg = PATTERNS[patternKey].renderMain(p.colors.accent, p.colors.foreground);
      const sideSvg = PATTERNS[patternKey].renderSidebar(p.colors.accent, p.colors.foreground);
      root.style.setProperty('--zpt-main-art-image', svgToDataUri(mainSvg));
      root.style.setProperty('--zpt-sidebar-art-image', svgToDataUri(sideSvg));
      root.style.setProperty(
        '--zpt-corner-ornament',
        ornamentKey === 'hui-wen' ? cornerFretworkDataUri(p.colors.accent) : 'none'
      );

      root.setAttribute('data-zpt-theme-active', 'true');
      root.setAttribute('data-zpt-theme-preset', p.preset);
      root.setAttribute('data-zpt-theme-mode', mode);
      root.setAttribute('data-zpt-theme-pattern', patternKey);
      root.setAttribute('data-zpt-theme-ornament', ornamentKey);
      syncDocumentThemeClasses(mode);
      mountShellTheme();
      updateArtBackdrop({ ...p, pattern: patternKey });
    }
    refreshSettingsLabel();
  }

  function presetMarkup(id, p) {
    const swatches = [p.colors.background, p.colors.sidebar, p.colors.panel, p.colors.accent, p.colors.function];
    return `<button class="zpt-preset" type="button" data-preset="${id}" aria-pressed="false">
      <span class="zpt-swatch" aria-hidden="true">${swatches.map((c) => `<span style="background:${c}"></span>`).join('')}</span>
      <span class="zpt-preset-top"><strong>${p.name}</strong><span class="zpt-preset-tag">${p.tag}</span></span>
      <small>${p.desc}</small>
      <span class="zpt-poem">「${p.poem}」</span>
    </button>`;
  }

  function renderSlotsMarkup() {
    const slots = readSlots();
    if (!slots.length) return '<span class="zpt-note">暂无收藏方案，调色后点击「收藏当前」可保存多套自定配置</span>';
    return slots
      .map(
        (s, idx) =>
          `<span class="zpt-slot-pill" data-slot-load="${idx}" role="button" tabindex="0" title="点击加载收藏方案：${s.title}">
            <span style="width:8px;height:8px;border-radius:50%;background:${s.theme.colors.accent}"></span>
            <span>${s.title}</span>
            <button type="button" class="zpt-slot-del" data-slot-del="${idx}" title="删除此收藏" aria-label="删除${s.title}">×</button>
          </span>`
      )
      .join('');
  }

  function previewAndControls() {
    if (!modal || !draft) return;
    for (const node of modal.querySelectorAll('[data-preset]')) {
      node.setAttribute('aria-pressed', String(node.dataset.preset === draft.preset));
    }
    for (const node of modal.querySelectorAll('[data-pattern]')) {
      node.setAttribute('aria-pressed', String(node.dataset.pattern === draft.pattern));
    }
    for (const node of modal.querySelectorAll('[data-ink]')) {
      node.setAttribute('aria-pressed', String(node.dataset.ink === draft.ink));
    }
    for (const node of modal.querySelectorAll('[data-ornament]')) {
      node.setAttribute('aria-pressed', String(node.dataset.ornament === draft.ornament));
    }
    for (const node of modal.querySelectorAll('[data-font]')) {
      node.setAttribute('aria-pressed', String(node.dataset.font === draft.font));
    }
    for (const key of COLOR_KEYS) {
      const input = modal.querySelector(`[data-color="${key}"]`);
      if (input) input.value = draft.colors[key];
      const output = modal.querySelector(`[data-value="${key}"]`);
      if (output) output.textContent = draft.colors[key];
    }
    const preview = modal.querySelector('.zpt-preview');
    if (preview) {
      for (const key of COLOR_KEYS) preview.style.setProperty('--preview-' + key, draft.colors[key]);
      preview.style.setProperty('--preview-art-opacity', INK_LEVELS[draft.ink || 'medium'].opacity);
    }
    const previewArt = modal.querySelector('.zpt-preview-art');
    if (previewArt) {
      const pat = PATTERNS[draft.pattern] || PATTERNS['shan-shui'];
      previewArt.innerHTML = pat.renderMain(draft.colors.accent, draft.colors.foreground);
    }
    const previewSeal = modal.querySelector('.zpt-preview-seal');
    if (previewSeal) {
      const pat = PATTERNS[draft.pattern] || PATTERNS['shan-shui'];
      previewSeal.textContent = pat.seal;
      previewSeal.style.background = draft.colors.accent;
    }
    const slotsContainer = modal.querySelector('#zpt-slots-list');
    if (slotsContainer) slotsContainer.innerHTML = renderSlotsMarkup();
    const status = modal.querySelector('.zpt-status');
    if (status) {
      const patName = PATTERNS[draft.pattern]?.name || '远山云水';
      status.textContent = `${PRESETS[draft.preset].name}${draft.custom ? '（自定义调色）' : ''} · 意境线条画：${patName} · 实时预览中`;
    }
  }

  function closeModal(commit = false) {
    if (!modal) return;
    if (commit) {
      const clean = draft ? valid(draft) : null;
      if (clean && persist(clean)) committed = clone(clean);
      else if (clean) console.warn('[ZCode Theme Manager] Theme settings could not be saved');
    }
    modal.remove();
    modal = null;
    draft = null;
    applyTheme(committed);
    if (lastFocus?.isConnected) lastFocus.focus();
  }

  function resetToOfficial() {
    persist(null);
    committed = null;
    draft = null;
    closeModal();
    applyTheme(null);
  }

  function openModal() {
    if (modal) return;
    lastFocus = document.activeElement;
    draft = committed ? clone(committed) : makePreset(DEFAULT_PRESET);
    modal = document.createElement('div');
    modal.className = 'zpt-overlay';
    modal.innerHTML = `
      <section class="zpt-dialog" role="dialog" aria-modal="true" aria-labelledby="zpt-title">
        <header class="zpt-header">
          <div>
            <div class="zpt-eyebrow"><span class="zpt-seal-badge">丹青</span> ZCODE · CHINESE AESTHETICS STUDIO</div>
            <h2 id="zpt-title">中式美学与白描意境主题馆</h2>
            <p class="zpt-note">10 套传统东方色谱 · 6 幅中式白描意境线条画 · 博古回纹装裱 · 全局侧栏与工作区深度适配（快捷键 Alt+Shift+T）</p>
          </div>
          <button class="zpt-close" aria-label="关闭并取消预览" type="button">×</button>
        </header>
        <div class="zpt-content">
          <section aria-label="主题预设与线条画">
            <div class="zpt-heading"><span>东方传统色谱（全中式主题）</span><span style="font-size:11px;font-weight:400;opacity:0.8">自动同步深浅模式与左侧导航栏</span></div>
            <div class="zpt-presets">${Object.entries(PRESETS).map(([id, p]) => presetMarkup(id, p)).join('')}</div>
            <div class="zpt-art-studio" aria-label="中式意境线条画与装裱">
              <div class="zpt-sub-group">
                <span class="zpt-sub-label">中式白描意境线条画（可自由搭配任意主题）</span>
                <div class="zpt-chips">${Object.entries(PATTERNS).map(([id, pat]) => `<button type="button" class="zpt-chip" data-pattern="${id}" aria-pressed="false" title="${pat.desc}">${pat.name}</button>`).join('')}</div>
              </div>
              <div class="zpt-sub-group" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
                <div>
                  <span class="zpt-sub-label">线条墨韵浓淡</span>
                  <div class="zpt-chips">${Object.entries(INK_LEVELS).map(([id, lv]) => `<button type="button" class="zpt-chip" data-ink="${id}" aria-pressed="false">${lv.name}</button>`).join('')}</div>
                </div>
                <div>
                  <span class="zpt-sub-label">古典边框纹样</span>
                  <div class="zpt-chips">${Object.entries(ORNAMENTS).map(([id, orn]) => `<button type="button" class="zpt-chip" data-ornament="${id}" aria-pressed="false" title="${orn.desc}">${orn.name}</button>`).join('')}</div>
                </div>
              </div>
              <div class="zpt-sub-group">
                <span class="zpt-sub-label">书卷字体韵味（仅调用本机字体栈）</span>
                <div class="zpt-chips">${Object.entries(FONTS).map(([id, fn]) => `<button type="button" class="zpt-chip" data-font="${id}" aria-pressed="false">${fn.name}</button>`).join('')}</div>
              </div>
            </div>
          </section>
          <section aria-label="自定义颜色与画卷预览">
            <div class="zpt-heading"><span>十三色精细调色盘</span><span style="font-size:11px;font-weight:400;opacity:0.8">修改即时渲染</span></div>
            <div class="zpt-editor">
              <div class="zpt-colors">${COLOR_KEYS.map((k) => `<label class="zpt-color-row" for="zpt-color-${k}"><span>${LABELS[k]}</span><span style="display:flex;align-items:center;gap:5px"><span class="zpt-color-value" data-value="${k}"></span><input type="color" id="zpt-color-${k}" data-color="${k}" aria-label="${LABELS[k]}"></span></label>`).join('')}</div>
              <div class="zpt-preview" aria-label="模拟界面与白描预览">
                <div class="zpt-preview-art" aria-hidden="true"></div>
                <div class="zpt-preview-top">
                  <span><i class="zpt-preview-dot"></i>ZCode · 丹青画卷预览</span>
                  <span class="zpt-preview-seal">山河</span>
                </div>
                <div class="zpt-preview-pane">
                  <div class="zpt-preview-sidebar">
                    <span>← 返回工作区</span>
                    <span style="opacity:0.75">● 外观设置</span>
                  </div>
                  <div class="zpt-preview-card">
                    <strong>东方美学工作台</strong><br>
                    <span style="opacity:0.8;font-size:9.5px">左侧栏与主视图色彩、白描底纹浑然一体</span><br>
                    <span class="zpt-preview-btn">挥毫运行 →</span>
                  </div>
                </div>
                <div class="zpt-preview-code"><span style="color:var(--preview-keyword)">const</span> <span style="color:var(--preview-function)">paintScroll</span> = <span style="color:var(--preview-string)">"千里江山"</span>; <span style="color:var(--preview-comment);font-style:italic">// 意境成画</span></div>
              </div>
              <div class="zpt-sub-group" style="margin-top:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
                  <span class="zpt-sub-label" style="margin:0">我的收藏方案 & 分享导入导出</span>
                  <div style="display:flex;gap:6px">
                    <button type="button" class="zpt-chip" id="zpt-save-slot-btn">+ 收藏当前</button>
                    <button type="button" class="zpt-chip" id="zpt-export-btn">导出分享</button>
                    <button type="button" class="zpt-chip" id="zpt-import-toggle-btn">导入配置</button>
                  </div>
                </div>
                <div class="zpt-slots-bar" id="zpt-slots-list"></div>
                <div class="zpt-io-box" id="zpt-io-box">
                  <textarea class="zpt-io-input" id="zpt-io-textarea" placeholder="在此粘贴主题 JSON 配置以导入，或点击上方「导出分享」生成配置..."></textarea>
                  <div style="display:flex;justify-content:flex-end;gap:6px">
                    <button type="button" class="zpt-chip" id="zpt-io-copy-btn">复制 JSON</button>
                    <button type="button" class="zpt-chip" id="zpt-io-apply-btn">解析并预览导入</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <footer class="zpt-footer">
          <button type="button" class="zpt-btn zpt-reset">恢复官方默认</button>
          <div class="zpt-actions">
            <button type="button" class="zpt-btn zpt-cancel">取消</button>
            <button type="button" class="zpt-btn zpt-primary">应用主题</button>
          </div>
          <div class="zpt-status" aria-live="polite" style="flex-basis:100%"></div>
        </footer>
      </section>`;
    document.body.appendChild(modal);

    const setPreset = (id) => {
      draft = makePreset(id);
      applyTheme(draft);
      previewAndControls();
    };
    modal.querySelectorAll('[data-preset]').forEach((node) =>
      node.addEventListener('click', () => setPreset(node.dataset.preset))
    );
    modal.querySelectorAll('[data-pattern]').forEach((node) =>
      node.addEventListener('click', () => {
        const pat = node.dataset.pattern;
        if (PATTERNS[pat]) {
          draft.pattern = pat;
          draft.custom = true;
          applyTheme(draft);
          previewAndControls();
        }
      })
    );
    modal.querySelectorAll('[data-ink]').forEach((node) =>
      node.addEventListener('click', () => {
        const ink = node.dataset.ink;
        if (INK_LEVELS[ink]) {
          draft.ink = ink;
          draft.custom = true;
          applyTheme(draft);
          previewAndControls();
        }
      })
    );
    modal.querySelectorAll('[data-ornament]').forEach((node) =>
      node.addEventListener('click', () => {
        const orn = node.dataset.ornament;
        if (ORNAMENTS[orn]) {
          draft.ornament = orn;
          draft.custom = true;
          applyTheme(draft);
          previewAndControls();
        }
      })
    );
    modal.querySelectorAll('[data-font]').forEach((node) =>
      node.addEventListener('click', () => {
        const fn = node.dataset.font;
        if (FONTS[fn]) {
          draft.font = fn;
          draft.custom = true;
          applyTheme(draft);
          previewAndControls();
        }
      })
    );
    modal.querySelectorAll('[data-color]').forEach((node) =>
      node.addEventListener('input', () => {
        const { color } = node.dataset;
        if (COLOR_KEYS.includes(color) && isHex(node.value)) {
          draft.colors[color] = node.value.toUpperCase();
          draft.custom = true;
          applyTheme(draft);
          previewAndControls();
        }
      })
    );

    // Custom Slots handlers
    const slotsList = modal.querySelector('#zpt-slots-list');
    slotsList?.addEventListener('click', (e) => {
      const delBtn = e.target.closest?.('[data-slot-del]');
      if (delBtn) {
        e.stopPropagation();
        const idx = Number(delBtn.dataset.slotDel);
        const slots = readSlots();
        slots.splice(idx, 1);
        saveSlots(slots);
        previewAndControls();
        return;
      }
      const pill = e.target.closest?.('[data-slot-load]');
      if (pill) {
        const idx = Number(pill.dataset.slotLoad);
        const slots = readSlots();
        if (slots[idx]?.theme) {
          draft = clone(slots[idx].theme);
          applyTheme(draft);
          previewAndControls();
        }
      }
    });

    modal.querySelector('#zpt-save-slot-btn')?.addEventListener('click', () => {
      const slots = readSlots();
      const baseName = PRESETS[draft.preset]?.name || '中式主题';
      const patName = PATTERNS[draft.pattern]?.name || '';
      const title = `${baseName}·${patName.slice(0, 2)}#${slots.length + 1}`;
      slots.unshift({ title, theme: clone(draft) });
      saveSlots(slots);
      previewAndControls();
      const status = modal.querySelector('.zpt-status');
      if (status) status.textContent = `已收藏方案「${title}」，可随时点击切换`;
    });

    // Import / Export handlers
    const ioBox = modal.querySelector('#zpt-io-box');
    const ioTextarea = modal.querySelector('#zpt-io-textarea');
    modal.querySelector('#zpt-export-btn')?.addEventListener('click', () => {
      if (!ioBox || !ioTextarea) return;
      ioBox.setAttribute('data-open', 'true');
      ioTextarea.value = JSON.stringify(draft, null, 2);
      ioTextarea.select?.();
      try {
        navigator.clipboard?.writeText(ioTextarea.value);
      } catch (_e) {}
      const status = modal.querySelector('.zpt-status');
      if (status) status.textContent = '已生成当前中式主题 JSON 配置，可复制分享给他人';
    });
    modal.querySelector('#zpt-import-toggle-btn')?.addEventListener('click', () => {
      if (!ioBox) return;
      const isOpen = ioBox.getAttribute('data-open') === 'true';
      ioBox.setAttribute('data-open', isOpen ? 'false' : 'true');
    });
    modal.querySelector('#zpt-io-copy-btn')?.addEventListener('click', () => {
      if (!ioTextarea) return;
      ioTextarea.select?.();
      try {
        navigator.clipboard?.writeText(ioTextarea.value);
      } catch (_e) {}
      const status = modal.querySelector('.zpt-status');
      if (status) status.textContent = '已复制主题配置 JSON 到剪贴板';
    });
    modal.querySelector('#zpt-io-apply-btn')?.addEventListener('click', () => {
      if (!ioTextarea) return;
      const status = modal.querySelector('.zpt-status');
      try {
        const parsed = valid(JSON.parse(ioTextarea.value));
        if (!parsed) {
          if (status) status.textContent = '⚠️ 导入失败：JSON 格式或颜色值不合法';
          return;
        }
        draft = clone(parsed);
        applyTheme(draft);
        previewAndControls();
        if (status) status.textContent = `✅ 已成功导入并预览「${PRESETS[draft.preset].name}」，点击应用主题即可保存`;
      } catch (_e) {
        if (status) status.textContent = '⚠️ 导入失败：请检查 JSON 语法是否完整';
      }
    });

    modal.querySelector('.zpt-close').addEventListener('click', () => closeModal());
    modal.querySelector('.zpt-cancel').addEventListener('click', () => closeModal());
    modal.querySelector('.zpt-primary').addEventListener('click', () => closeModal(true));
    modal.querySelector('.zpt-reset').addEventListener('click', resetToOfficial);
    modal.addEventListener('mousedown', (event) => {
      if (event.target === modal) closeModal();
    });
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = [...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)')];
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) {
        focusables.at(-1).focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === focusables.at(-1)) {
        focusables[0].focus();
        event.preventDefault();
      }
    });
    applyTheme(draft);
    previewAndControls();
    modal.querySelector('.zpt-close').focus();
  }

  function themeSummary() {
    if (!committed) return '当前：跟随 ZCode 官方主题';
    const presetName = PRESETS[committed.preset]?.name || committed.preset;
    const patName = PATTERNS[committed.pattern]?.name;
    const suffix = committed.custom ? '（自定义）' : '';
    return patName && committed.pattern !== 'none'
      ? `当前：${presetName}${suffix} · 线条画：${patName}`
      : `当前：${presetName}${suffix}`;
  }

  function refreshSettingsLabel() {
    const label = document.getElementById('zpt-settings-current');
    if (label && label.textContent !== themeSummary()) label.textContent = themeSummary();
  }

  function mountSettingsEntry() {
    const content = document.querySelector('[data-active-section="appearance"] .space-y-0.px-0');
    if (!content || content.querySelector('#zpt-settings-row')) {
      refreshSettingsLabel();
      return;
    }
    const row = document.createElement('div');
    row.id = 'zpt-settings-row';
    row.innerHTML = `
      <div class="zpt-settings-layout">
        <div>
          <div class="zpt-settings-title"><span class="zpt-seal-badge">丹青</span> 自定义中式主题与意境画</div>
          <div class="zpt-settings-desc" id="zpt-settings-current"></div>
        </div>
        <button id="zpt-settings-open" type="button" aria-label="打开自定义主题管理器">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 8h.01M15 7h.01M17 13h.01M9 16h.01"/><path d="M13 17c0 2 4 3 4 0"/></svg>
          管理主题
        </button>
      </div>`;
    row.querySelector('#zpt-settings-open').addEventListener('click', openModal);
    content.appendChild(row);
    refreshSettingsLabel();
  }

  function start() {
    if (window.__ZCODE_THEME_MANAGER_LOADED__) return;
    window.__ZCODE_THEME_MANAGER_LOADED__ = VERSION;
    setupCss();
    applyTheme(committed);
    mountSettingsEntry();
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', (event) => {
        if (event.altKey && event.shiftKey && (event.key === 'T' || event.key === 't')) {
          event.preventDefault();
          if (modal) closeModal();
          else openModal();
        }
      });
    }
    let scheduled = false;
    const refresh = () => {
      if (scheduled) return;
      scheduled = true;
      const defer = window.requestAnimationFrame || ((cb) => setTimeout(cb, 80));
      defer(() => {
        scheduled = false;
        mountSettingsEntry();
        mountShellTheme();
      });
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (window.__ZPT_TEST_MODE__) {
    window.__ZPT_TEST_API__ = {
      PRESETS,
      LEGACY_PRESET_MAP,
      PATTERNS,
      INK_LEVELS,
      ORNAMENTS,
      FONTS,
      COLOR_KEYS,
      valid,
      makePreset,
      readStored,
      persist,
      readSlots,
      saveSlots,
      applyTheme,
      isHex,
      effectiveMode,
      getCommitted: () => committed,
      mountSettingsEntry,
      mountShellTheme,
      themeSummary,
    };
    return;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
