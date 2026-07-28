// src/data/grade2DataHandlingWorksheet.ts

export const GRADE_2_DATA_HANDLING_WORKSHEET = {
  content: `
<div class="font-sans text-slate-800 max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
  <!-- 🎨 ULTRA-PREMIUM HEADER SECTION -->
  <div class="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-3xl overflow-hidden shadow-lg mb-8">
    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
    <div class="relative z-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-blue-100 mb-2">
            South African CAPS Curriculum
          </span>
          <h1 class="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">
            Mathematics Worksheet
          </h1>
          <p class="text-lg text-blue-100 font-medium">
            Topic: Data Handling – Collecting & Sorting South African Objects
          </p>
        </div>
        
        <!-- Grade Badge -->
        <div class="bg-white/20 backdrop-blur-md rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl border border-white/30 self-center">
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-100 font-mono">Grade</span>
          <span class="text-3xl font-black text-white">2</span>
        </div>
      </div>

      <!-- CAPS-aligned Metadata Strip -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20 text-sm">
        <div class="flex items-center gap-2 text-blue-50">
          <span class="text-lg">📚</span>
          <span><strong class="font-semibold text-white">Subject:</strong> Mathematics</span>
        </div>
        <div class="flex items-center gap-2 text-blue-50">
          <span class="text-lg">📅</span>
          <span><strong class="font-semibold text-white">Term:</strong> Term 2 / 3</span>
        </div>
        <div class="flex items-center gap-2 text-blue-50">
          <span class="text-lg">🎯</span>
          <span><strong class="font-semibold text-white">Total Marks:</strong> 20 Marks</span>
        </div>
        <div class="flex items-center gap-2 text-blue-50">
          <span class="text-lg">⏱️</span>
          <span><strong class="font-semibold text-white">Duration:</strong> 1 - 2 Hours</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CAPS METADATA CARD (TEACHER REFERENCE) -->
  <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
    <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
      <span>📐</span> CAPS Alignment & Pedagogical Goals (Teacher Reference)
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
      <div>
        <p class="mb-1"><strong class="font-semibold text-slate-700">CAPS Reference:</strong> Section 5 (Data Handling), Foundation Phase Mathematics Curriculum Page 104.</p>
        <p class="mb-1"><strong class="font-semibold text-slate-700">Learning Objectives:</strong> Collect physical objects, sort by one attribute, tally and count, draw a pictograph, and interpret simple data representation.</p>
      </div>
      <div>
        <p class="mb-1"><strong class="font-semibold text-slate-700">Cognitive Levels:</strong> Remembering (identify), Understanding (sort, tally), Applying (graphing), Analyzing (interpreting questions).</p>
        <p class="mb-1"><strong class="font-semibold text-slate-700">South African Context:</strong> Local fauna (Kruger Park animals), indigenous flora (Marula, Kei Apple, Wild Plum), and local school items.</p>
      </div>
    </div>
  </div>

  <!-- METADATA INPUT SECTION & SCORE BOX -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
      <div>
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Learner's Full Name</label>
        <div class="border-b-2 border-dashed border-slate-300 pb-2 min-w-[200px] text-lg font-bold text-slate-800">
          &nbsp;
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mt-2">
        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Classroom Group</label>
          <div class="border-b-2 border-dashed border-slate-300 pb-2 text-base font-bold text-slate-800">
            &nbsp;
          </div>
        </div>
        <div>
          <label class="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Date</label>
          <div class="border-b-2 border-dashed border-slate-300 pb-2 text-base font-bold text-slate-800">
            &nbsp;
          </div>
        </div>
      </div>
    </div>

    <!-- Beautiful Yellow Score Capsule Card (Strictly aligned, no position overlaps) -->
    <div class="bg-gradient-to-br from-amber-50 to-yellow-100 border-4 border-amber-400 rounded-3xl p-5 shadow-lg flex flex-col justify-center items-center text-center">
      <p class="text-xs font-extrabold uppercase tracking-widest text-amber-800 mb-1">
        STUDENT SCORE
      </p>
      <div class="flex items-center justify-center gap-1 my-2">
        <span class="text-4xl font-black text-amber-900 bg-white/70 px-4 py-1 rounded-2xl border-2 border-dashed border-amber-300 shadow-inner">
          &nbsp;&nbsp;&nbsp;&nbsp;
        </span>
        <span class="text-3xl font-black text-amber-800">/</span>
        <span class="text-4xl font-black text-amber-950 bg-white/70 px-4 py-1 rounded-2xl border-2 border-amber-300 shadow-md">
          20
        </span>
      </div>
      <p class="text-[10px] font-bold text-amber-700 uppercase tracking-wider mt-1">
        MARKS TOTAL
      </p>
    </div>
  </div>

  <!-- INSTRUCTIONS BOX -->
  <div class="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-2xl p-6 shadow-md mb-8">
    <div class="flex items-start gap-4">
      <span class="text-3xl">📋</span>
      <div>
        <h3 class="text-sm font-black uppercase tracking-wider text-amber-950 mb-2">Instructions & Guidelines</h3>
        <p class="text-amber-900 font-medium text-sm leading-relaxed">
          Welcome to your South African Math Adventure, Grade 2 learner! Read each question carefully. Follow the examples, fill in the tally tables, complete the pictographs, and write your answers in the dotted spaces provided. Grab your lead pencils, eraser, and some colored crayons!
        </p>
      </div>
    </div>
  </div>

  <!-- QUESTION 1 -->
  <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm hover:shadow-md transition duration-300">
    <div class="flex items-start gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
        1
      </div>
      <div class="flex-grow">
        <h2 class="text-lg font-bold text-slate-800 flex justify-between items-center flex-wrap gap-2">
          <span>Question 1: Sorting Kruger National Park Animals (Tally Table)</span>
          <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-extrabold">[6 Marks]</span>
        </h2>
        <p class="text-slate-600 text-sm mt-1">
          Thabo went on a school safari trip to the Kruger National Park and saw many local South African animals! Help Thabo sort these animals by filling in the tally marks and total numbers.
        </p>
      </div>
    </div>

    <!-- Animal List -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-center">
      <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">ANIMALS THABO SAW:</p>
      <div class="flex flex-wrap justify-center gap-3 text-lg md:text-xl font-bold bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
        <span class="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">🦁 Lion</span>
        <span class="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100">🦌 Springbok</span>
        <span class="px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">🐘 Elephant</span>
        <span class="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">🦁 Lion</span>
        <span class="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100">🦌 Springbok</span>
        <span class="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100">🦌 Springbok</span>
        <span class="px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">🐘 Elephant</span>
        <span class="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100">🦌 Springbok</span>
        <span class="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">🦁 Lion</span>
        <span class="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100">🦌 Springbok</span>
        <span class="px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">🐘 Elephant</span>
        <span class="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100">🦌 Springbok</span>
      </div>
    </div>

    <!-- Tally Table -->
    <div class="overflow-hidden border border-slate-200 rounded-xl mb-6">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
          <tr>
            <th class="p-3 text-left w-1/3">Animal Category</th>
            <th class="p-3 text-left w-1/3">Tally Marks (Draw lines, e.g., | | |)</th>
            <th class="p-3 text-center w-1/3">Total Number (Write digit)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr>
            <td class="p-4 font-bold flex items-center gap-2">🦁 Lion</td>
            <td class="p-4 border-l border-r border-slate-200 text-slate-400 font-mono italic">Draw here: .......................................</td>
            <td class="p-4 text-center text-slate-400">................... (2 Marks)</td>
          </tr>
          <tr>
            <td class="p-4 font-bold flex items-center gap-2">🦌 Springbok</td>
            <td class="p-4 border-l border-r border-slate-200 text-slate-400 font-mono italic">Draw here: .......................................</td>
            <td class="p-4 text-center text-slate-400">................... (2 Marks)</td>
          </tr>
          <tr>
            <td class="p-4 font-bold flex items-center gap-2">🐘 Elephant</td>
            <td class="p-4 border-l border-r border-slate-200 text-slate-400 font-mono italic">Draw here: .......................................</td>
            <td class="p-4 text-center text-slate-400">................... (2 Marks)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- QUESTION 2 -->
  <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm hover:shadow-md transition duration-300">
    <div class="flex items-start gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
        2
      </div>
      <div class="flex-grow">
        <h2 class="text-lg font-bold text-slate-800 flex justify-between items-center flex-wrap gap-2">
          <span>Question 2: Lerato's Sweet Indigenous Fruit (Pictograph Drawing)</span>
          <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-extrabold">[6 Marks]</span>
        </h2>
        <p class="text-slate-600 text-sm mt-1">
          Lerato collected sweet South African fruits from her grandmother's garden in Limpopo: Marula fruits, Kei Apples, and Wild Plums! Draw sweet round fruits 🟢 inside the pictograph to show how many she picked of each.
        </p>
      </div>
    </div>

    <!-- Fruit Pick Count -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-bold uppercase mb-1">Kei Apples 🟡</p>
          <p class="text-xl font-extrabold text-amber-600">4 fruits</p>
        </div>
        <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-bold uppercase mb-1">Marula Fruits 🟠</p>
          <p class="text-xl font-extrabold text-orange-600">6 fruits</p>
        </div>
        <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-bold uppercase mb-1">Wild Plums 🔴</p>
          <p class="text-xl font-extrabold text-rose-600">3 fruits</p>
        </div>
      </div>
    </div>

    <!-- Pictograph Layout -->
    <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50 mb-6">
      <p class="text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
        🍎 PICTOGRAPH: INDIGENOUS FRUIT COLLECTED 🍎
      </p>
      
      <!-- Key Box -->
      <div class="bg-white border border-dashed border-slate-300 rounded-xl p-3 mb-4 text-center text-xs font-bold text-slate-600">
        🔑 KEY: Each drawn fruit circle (🟢) equals <strong class="text-indigo-600">1 Real Fruit</strong>.
      </div>

      <div class="grid grid-cols-12 gap-2 text-sm">
        <!-- Kei Apples -->
        <div class="col-span-3 font-bold flex items-center p-2 bg-white rounded-l-xl border border-slate-200">
          🟡 Kei Apple
        </div>
        <div class="col-span-9 p-3 bg-white border-y border-r border-slate-200 rounded-r-xl flex items-center gap-3 min-h-[50px] text-slate-300 italic">
          Draw fruit circles here: ........................................................................................ (2 Marks)
        </div>

        <!-- Marula Fruits -->
        <div class="col-span-3 font-bold flex items-center p-2 bg-white rounded-l-xl border border-slate-200 mt-2">
          🟠 Marula
        </div>
        <div class="col-span-9 p-3 bg-white border-y border-r border-slate-200 rounded-r-xl flex items-center gap-3 min-h-[50px] text-slate-300 italic mt-2">
          Draw fruit circles here: ........................................................................................ (2 Marks)
        </div>

        <!-- Wild Plums -->
        <div class="col-span-3 font-bold flex items-center p-2 bg-white rounded-l-xl border border-slate-200 mt-2">
          🔴 Wild Plum
        </div>
        <div class="col-span-9 p-3 bg-white border-y border-r border-slate-200 rounded-r-xl flex items-center gap-3 min-h-[50px] text-slate-300 italic mt-2">
          Draw fruit circles here: ........................................................................................ (2 Marks)
        </div>
      </div>
    </div>
  </div>

  <!-- QUESTION 3 -->
  <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm hover:shadow-md transition duration-300">
    <div class="flex items-start gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
        3
      </div>
      <div class="flex-grow">
        <h2 class="text-lg font-bold text-slate-800 flex justify-between items-center flex-wrap gap-2">
          <span>Question 3: Sipho's School Bag Items (Bar Graph Analysis)</span>
          <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-extrabold">[6 Marks]</span>
        </h2>
        <p class="text-slate-600 text-sm mt-1">
          Sipho emptied his school bag in Soweto and sorted his school supplies! He made a beautiful, interactive bar graph to show how many items he has. Read the bar graph to answer the questions.
        </p>
      </div>
    </div>

    <!-- CSS-based Bar Graph Representation -->
    <div class="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
      <div class="flex flex-col items-center">
        <!-- Graph Title -->
        <p class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-6">SIPHO'S SUPPLY BAR GRAPH</p>
        
        <!-- Graph Grid Area -->
        <div class="w-full max-w-md h-48 border-l-2 border-b-2 border-slate-400 relative flex items-end justify-around pb-1">
          
          <!-- Y-axis Guidelines (Background helper) -->
          <div class="absolute bottom-0 left-0 right-0 h-full flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-300 pl-1">
            <div class="border-t border-dashed border-slate-200 w-full h-0 pt-0"></div>
            <div class="border-t border-dashed border-slate-200 w-full h-0 pt-0"></div>
            <div class="border-t border-dashed border-slate-200 w-full h-0 pt-0"></div>
            <div class="border-t border-dashed border-slate-200 w-full h-0 pt-0"></div>
          </div>

          <!-- Y-axis Markers -->
          <div class="absolute left-[-20px] h-full flex flex-col justify-between text-[10px] font-extrabold text-slate-500 select-none py-1">
            <span>8</span>
            <span>6</span>
            <span>4</span>
            <span>2</span>
            <span>0</span>
          </div>

          <!-- Bar 1: Lead Pencils (Value 8) -->
          <div class="flex flex-col items-center w-16">
            <span class="text-xs font-black text-blue-600 mb-1">8</span>
            <div class="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md shadow-md" style="height: 110px;"></div>
            <span class="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">✏️ Lead<br/>Pencil</span>
          </div>

          <!-- Bar 2: Exercise Books (Value 5) -->
          <div class="flex flex-col items-center w-16">
            <span class="text-xs font-black text-amber-600 mb-1">5</span>
            <div class="w-8 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-md shadow-md" style="height: 68px;"></div>
            <span class="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">📓 Exercise<br/>Book</span>
          </div>

          <!-- Bar 3: Rulers (Value 3) -->
          <div class="flex flex-col items-center w-16">
            <span class="text-xs font-black text-emerald-600 mb-1">3</span>
            <div class="w-8 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md shadow-md" style="height: 42px;"></div>
            <span class="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">📏 Ruler</span>
          </div>

          <!-- Bar 4: South African Coins (Value 7) -->
          <div class="flex flex-col items-center w-16">
            <span class="text-xs font-black text-purple-600 mb-1">7</span>
            <div class="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-md shadow-md" style="height: 96px;"></div>
            <span class="text-[10px] font-bold text-slate-500 mt-2 text-center leading-tight">🪙 Rand<br/>Coin</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Questions Block -->
    <div class="space-y-4">
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p class="font-bold text-slate-800 text-sm">
          a) Which item does Sipho have the <strong class="text-blue-600">most</strong> of?
        </p>
        <div class="border-b-2 border-dashed border-slate-300 pb-1 mt-1 text-slate-500 font-mono italic text-sm">
          Answer here: ........................................................................................ (2 Marks)
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p class="font-bold text-slate-800 text-sm">
          b) How many more pencils does he have than rulers?
        </p>
        <div class="border-b-2 border-dashed border-slate-300 pb-1 mt-1 text-slate-500 font-mono italic text-sm">
          Answer here: ........................................................................................ (2 Marks)
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p class="font-bold text-slate-800 text-sm">
          c) What is the total sum of Sipho's pencils and exercise books together?
        </p>
        <div class="border-b-2 border-dashed border-slate-300 pb-1 mt-1 text-slate-500 font-mono italic text-sm">
          Answer here: ........................................................................................ (2 Marks)
        </div>
      </div>
    </div>
  </div>

  <!-- QUESTION 4 -->
  <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm hover:shadow-md transition duration-300">
    <div class="flex items-start gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
        4
      </div>
      <div class="flex-grow">
        <h2 class="text-lg font-bold text-slate-800 flex justify-between items-center flex-wrap gap-2">
          <span>Question 4: Critical Thinking (Why Sort Data?)</span>
          <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-extrabold">[2 Marks]</span>
        </h2>
        <p class="text-slate-600 text-sm mt-1">
          Imagine Priya has a fruit tuckshop at school. Why is it helpful for her to sort and count her fruits before the morning break? Write one sentence explaining.
        </p>
      </div>
    </div>

    <!-- Answer Box -->
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <p class="font-bold text-slate-800 text-sm mb-1">Your Reasoning:</p>
      <div class="border-b-2 border-dashed border-slate-300 pb-1 text-slate-400 font-mono italic text-sm leading-8">
        ...............................................................................................................................................................<br/>
        ............................................................................................................................................................... (2 Marks)
      </div>
    </div>
  </div>

  <!-- CONSOLIDATION & CELEBRATION BADGE -->
  <div class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 text-center shadow-lg">
    <span class="text-4xl">🌟</span>
    <h3 class="text-xl font-extrabold mt-2">Well Done, Champion!</h3>
    <p class="text-emerald-100 text-sm mt-1 max-w-md mx-auto">
      You have successfully finished your South African Data Handling Worksheet! Your teacher is so proud of you. Take a nice deep breath!
    </p>
  </div>
</div>
  `.trim(),

  memo: `
<div class="font-sans text-slate-800 max-w-4xl mx-auto bg-slate-50 p-6 md:p-8 rounded-3xl border-2 border-slate-200 shadow-xl">
  <div class="flex items-center gap-3 mb-6">
    <span class="text-3xl">🔑</span>
    <div>
      <h1 class="text-2xl font-black text-slate-900">Memorandum / Marking Guidelines</h1>
      <p class="text-sm text-slate-600">Grade 2 Mathematics — Data Handling: Collecting & Sorting Objects</p>
    </div>
  </div>

  <div class="space-y-6">
    <!-- Q1 Memo -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 class="font-extrabold text-indigo-700 text-sm border-b pb-2 mb-3">QUESTION 1: Kruger Safari Animals (6 Marks Total)</h3>
      <div class="space-y-3 text-sm">
        <p><strong class="font-semibold text-slate-700">a) Lion Category:</strong></p>
        <ul class="list-disc pl-5 text-slate-600 space-y-1">
          <li>Tally marks: ||| (3 vertical tally strokes) <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
          <li>Total number: 3 <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
        </ul>
        <p><strong class="font-semibold text-slate-700">b) Springbok Category:</strong></p>
        <ul class="list-disc pl-5 text-slate-600 space-y-1">
          <li>Tally marks: ̶|̶|̶|̶|̶ | (A cluster of 5 tally strokes crossed, and 1 vertical stroke) <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
          <li>Total number: 6 <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
        </ul>
        <p><strong class="font-semibold text-slate-700">c) Elephant Category:</strong></p>
        <ul class="list-disc pl-5 text-slate-600 space-y-1">
          <li>Tally marks: ||| (3 vertical tally strokes) <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
          <li>Total number: 3 <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
        </ul>
      </div>
    </div>

    <!-- Q2 Memo -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 class="font-extrabold text-indigo-700 text-sm border-b pb-2 mb-3">QUESTION 2: Lerato's Indigenous Fruit (6 Marks Total)</h3>
      <div class="space-y-3 text-sm text-slate-600">
        <p>The teacher should grade drawings of circles (🟢) inside each fruit row on the worksheet:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong class="font-semibold text-slate-700">Kei Apple row:</strong> 4 circles (🟢🟢🟢🟢) <span class="text-emerald-600 font-bold">[2 Marks]</span> (1 mark for exact count, 1 mark for clear/spaced drawing).</li>
          <li><strong class="font-semibold text-slate-700">Marula fruit row:</strong> 6 circles (🟢🟢🟢🟢🟢🟢) <span class="text-emerald-600 font-bold">[2 Marks]</span> (1 mark for exact count, 1 mark for clear/spaced drawing).</li>
          <li><strong class="font-semibold text-slate-700">Wild Plum row:</strong> 3 circles (🟢🟢🟢) <span class="text-emerald-600 font-bold">[2 Marks]</span> (1 mark for exact count, 1 mark for clear/spaced drawing).</li>
        </ul>
      </div>
    </div>

    <!-- Q3 Memo -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 class="font-extrabold text-indigo-700 text-sm border-b pb-2 mb-3">QUESTION 3: Sipho's Supplies Graph (6 Marks Total)</h3>
      <div class="space-y-3 text-sm text-slate-600">
        <p>
          <strong class="font-semibold text-slate-700">a) Item with the most:</strong> Lead Pencil (8 items total) 
          <span class="text-emerald-600 font-bold">[2 Marks]</span> (Accept "pencil" or "lead pencil").
        </p>
        <p>
          <strong class="font-semibold text-slate-700">b) Difference between pencils and rulers:</strong> 5 items more 
          <span class="text-emerald-600 font-bold">[2 Marks]</span> (Calculated as 8 pencils minus 3 rulers = 5. Accept "5").
        </p>
        <p>
          <strong class="font-semibold text-slate-700">c) Total sum of pencils and exercise books:</strong> 13 items altogether 
          <span class="text-emerald-600 font-bold">[2 Marks]</span> (Calculated as 8 pencils plus 5 exercise books = 13. Accept "13").
        </p>
      </div>
    </div>

    <!-- Q4 Memo -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 class="font-extrabold text-indigo-700 text-sm border-b pb-2 mb-3">QUESTION 4: Critical Thinking tuckshop (2 Marks Total)</h3>
      <div class="text-sm text-slate-600 space-y-2">
        <p>Any logical answer showing understanding of planning, checking stock, or preparing for customers is acceptable:</p>
        <p class="italic bg-slate-50 p-3 rounded-xl border border-slate-100">
          "Example: Priya wants to know how many apples and bananas she has so she doesn't run out during break, or she wants to see which fruit sells best."
        </p>
        <p><strong class="font-semibold text-slate-700">Mark Allocation:</strong></p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Provides logical reason showing understanding of stock counting or customer demands. <span class="text-emerald-600 font-bold">[2 Marks]</span></li>
          <li>Provides a simple reason but lacks context or detail. <span class="text-emerald-600 font-bold">[1 Mark]</span></li>
        </ul>
      </div>
    </div>
  </div>
</div>
  `.trim(),

  rubric: `
<div class="font-sans text-slate-800 max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl">
  <div class="flex items-center gap-3 mb-6">
    <span class="text-3xl">📋</span>
    <div>
      <h1 class="text-xl font-extrabold text-slate-900">CAPS Diagnostic Grading Rubric</h1>
      <p class="text-xs text-slate-500">Subject: Mathematics | Grade 2 | Topic: Data Handling (Collecting, Representing, Interpreting)</p>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-xs border-collapse border border-slate-200">
      <thead>
        <tr class="bg-slate-100 border-b border-slate-200 text-slate-700">
          <th class="p-3 border border-slate-200 text-left w-1/4">Criteria</th>
          <th class="p-3 border border-slate-200 text-left">Level 1 (Not Achieved)</th>
          <th class="p-3 border border-slate-200 text-left">Level 2 (Partially Achieved)</th>
          <th class="p-3 border border-slate-200 text-left">Level 3 (Achieved)</th>
          <th class="p-3 border border-slate-200 text-left">Level 4 (Outstanding)</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 text-slate-600">
        <tr>
          <td class="p-3 border border-slate-200 font-extrabold text-slate-800">
            Data Collection & Tallying<br/>(Question 1)
          </td>
          <td class="p-3 border border-slate-200 bg-red-50/20">
            Cannot count or record tallies. Has multiple mistakes in animal counting. (Score 0-2)
          </td>
          <td class="p-3 border border-slate-200 bg-amber-50/20">
            Records some tally marks but drawing format is incomplete or count has minor errors. (Score 3-4)
          </td>
          <td class="p-3 border border-slate-200 bg-emerald-50/20">
            Correctly tally-records and counts all animal groups with minimal guidance. (Score 5)
          </td>
          <td class="p-3 border border-slate-200 bg-emerald-100/30 font-semibold text-slate-900">
            Perfect, pristine tally drawing and digit counts for all categories. (Score 6)
          </td>
        </tr>
        <tr class="mt-2">
          <td class="p-3 border border-slate-200 font-extrabold text-slate-800">
            Pictograph Drawing<br/>(Question 2)
          </td>
          <td class="p-3 border border-slate-200 bg-red-50/20">
            Cannot represent numbers using circles. Draws arbitrary values. (Score 0-2)
          </td>
          <td class="p-3 border border-slate-200 bg-amber-50/20">
            Draws fruit circles but counts are slightly off (by 1-2 fruits) or layout is messy. (Score 3-4)
          </td>
          <td class="p-3 border border-slate-200 bg-emerald-50/20">
            Accurately represents all fruit categories with correct circles on grid rows. (Score 5)
          </td>
          <td class="p-3 border border-slate-200 bg-emerald-100/30 font-semibold text-slate-900">
            Exceptionally neat, precise drawings corresponding perfectly with fruit tallies. (Score 6)
          </td>
        </tr>
        <tr class="mt-2">
          <td class="p-3 border border-slate-200 font-extrabold text-slate-800">
            Bar Graph Interpretation<br/>(Question 3)
          </td>
          <td class="p-3 border border-slate-200 bg-red-50/20">
            Cannot read values from graph heights. All 3 answers are incorrect. (Score 0-2)
          </td>
          <td class="p-3 border border-slate-200 bg-amber-50/20">
            Reads some graph values but gets addition/subtraction comparisons wrong. (Score 3-4)
          </td>
          <td class="p-3 border border-slate-200 bg-emerald-50/20">
            Correctly reads graph values and performs simple math comparison questions. (Score 5)
          </td>
          <td class="p-3 border border-slate-200 bg-emerald-100/30 font-semibold text-slate-900">
            Masterful reading and calculation of data difference and aggregate values. (Score 6)
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `.trim()
};
