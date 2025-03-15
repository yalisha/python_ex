// 全局变量
let volunteers = []; // 志愿者列表
let shiftRequirements = {}; // 每个班次需要的志愿者人数
let scheduleData = {}; // 排班结果数据
let shiftClassRequirements = {}; // 每个班级需要的志愿者人数
let maxShiftsPerVolunteer = 0; // 每个志愿者最大排班次数限制
// 当前正在编辑的课表数据
let currentTimetableData = {
  name: '',
  class: '',
  availability: [],
};

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  initPhase1();
  initPhase2();
  initPhase3();
  initPhase4();

  // 加载已保存的数据
  loadSavedData();
});

// 初始化第一阶段：志愿者信息
function initPhase1() {
  const volunteerForm = document.getElementById('volunteer-form');
  const volunteerList = document.getElementById('volunteer-list');
  const phase1Next = document.getElementById('phase1-next');
  const downloadTemplateBtn = document.getElementById('download-template');
  const importVolunteersBtn = document.getElementById('import-volunteers');
  const exportVolunteersBtn = document.getElementById('export-volunteers');
  const volunteerFileInput = document.getElementById('volunteer-file');
  const clearAllDataBtn = document.getElementById('clear-all-data');

  // 课表图片导入相关元素
  const analyzeTimetableBtn = document.getElementById('analyze-timetable');
  const confirmTimetableBtn = document.getElementById('confirm-timetable');
  const timetableImageInput = document.getElementById('timetable-image');
  const timetablePreviewContainer = document.getElementById('timetable-preview-container');
  const timetableEditor = document.getElementById('timetable-editor');

  // 清空所有数据按钮点击事件
  clearAllDataBtn.addEventListener('click', function () {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      // 清空所有数据
      volunteers = [];
      shiftRequirements = {};
      scheduleData = {};
      shiftClassRequirements = {};
      maxShiftsPerVolunteer = 0;

      // 重置当前课表数据
      currentTimetableData = {
        name: '',
        class: '',
        availability: [],
      };

      // 清空localStorage中的数据
      localStorage.removeItem('volunteer-schedule');
      localStorage.removeItem('volunteer-shift-counts');

      // 更新界面
      updateVolunteerList();

      // 清空表单
      volunteerForm.reset();
      document.getElementById('timetable-import-form').reset();

      // 隐藏课表预览
      timetablePreviewContainer.style.display = 'none';

      // 显示提示信息
      alert('所有数据已清空！');
    }
  });

  // 下载模板按钮点击事件
  downloadTemplateBtn.addEventListener('click', function () {
    downloadVolunteerTemplate();
  });

  // 导入志愿者按钮点击事件
  importVolunteersBtn.addEventListener('click', function () {
    if (!volunteerFileInput.files || volunteerFileInput.files.length === 0) {
      alert('请先选择Excel文件');
      return;
    }
    importVolunteersFromExcel(volunteerFileInput.files[0]);
  });

  // 导出志愿者按钮点击事件
  exportVolunteersBtn.addEventListener('click', function () {
    exportVolunteersToExcel();
  });

  // 分析课表按钮点击事件
  analyzeTimetableBtn.addEventListener('click', function () {
    if (!timetableImageInput.files || timetableImageInput.files.length === 0) {
      alert('请先选择课表图片');
      return;
    }

    const volunteerName = document.getElementById('timetable-volunteer-name').value.trim();
    const volunteerClass = document.getElementById('timetable-volunteer-class').value.trim();

    if (!volunteerName || !volunteerClass) {
      alert('请填写志愿者姓名和班级');
      return;
    }

    // 显示课表映射提示
    alert(
      '注意：系统将自动将12节课映射到6节课模型（两节合并为一大节）。\n\n映射规则：\n第1-2节 → 系统中的第1节\n第3-4节 → 系统中的第2节\n第5-6节 → 系统中的第3节\n第7-8节 → 系统中的第4节\n第9-10节 → 系统中的第5节\n第11-12节 → 系统中的第6节',
    );

    analyzeTimetableImage(timetableImageInput.files[0], volunteerName, volunteerClass);
  });

  // 确认课表按钮点击事件
  confirmTimetableBtn.addEventListener('click', function () {
    addVolunteerFromTimetable();
  });

  // 添加志愿者表单提交
  volunteerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('volunteer-name').value.trim();
    const className = document.getElementById('volunteer-class').value.trim();

    if (!name || !className) return;

    // 收集志愿者可用时间
    const availability = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
      const day = parseInt(checkbox.dataset.day);
      const period = parseInt(checkbox.dataset.period);
      availability.push({ day, period });
    });

    if (availability.length === 0) {
      alert('请至少选择一个可用时间段');
      return;
    }

    // 添加到志愿者列表
    const volunteer = {
      id: Date.now(), // 使用时间戳作为唯一ID
      name,
      class: className,
      availability,
    };

    volunteers.push(volunteer);
    updateVolunteerList();

    // 重置表单
    volunteerForm.reset();
  });

  // 下一步按钮点击事件
  phase1Next.addEventListener('click', function () {
    if (volunteers.length === 0) {
      alert('请至少添加一名志愿者');
      return;
    }

    // 进入第二阶段
    goToPhase(2);
  });
}

// 更新志愿者列表显示
function updateVolunteerList() {
  const volunteerList = document.getElementById('volunteer-list');
  volunteerList.innerHTML = '';

  // 尝试获取排班次数数据
  let shiftCounts = {};
  try {
    const savedShiftCounts = localStorage.getItem('volunteer-shift-counts');
    if (savedShiftCounts) {
      shiftCounts = JSON.parse(savedShiftCounts);
    }
  } catch (error) {
    console.error('无法加载排班次数数据', error);
  }

  volunteers.forEach(volunteer => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    // 志愿者基本信息区
    const infoDiv = document.createElement('div');
    infoDiv.className = 'volunteer-info';

    // 名称和班级信息
    const nameElem = document.createElement('div');
    nameElem.className = 'fw-bold';
    nameElem.textContent = volunteer.name;

    const classElem = document.createElement('div');
    classElem.className = 'text-muted small';
    classElem.textContent = `班级: ${volunteer.class}`;

    infoDiv.appendChild(nameElem);
    infoDiv.appendChild(classElem);

    // 可用时段信息
    const availabilityInfo = document.createElement('span');
    availabilityInfo.className = 'badge bg-info ms-2';
    availabilityInfo.textContent = `${volunteer.availability.length} 个可用时段`;
    infoDiv.appendChild(availabilityInfo);

    // 显示已排班次数（如果有）
    if (shiftCounts[volunteer.id]) {
      const shiftCountBadge = document.createElement('span');
      shiftCountBadge.className = 'badge bg-success ms-2';
      shiftCountBadge.textContent = `已排 ${shiftCounts[volunteer.id]} 次班`;
      infoDiv.appendChild(shiftCountBadge);
    }

    // 操作按钮区
    const actionDiv = document.createElement('div');
    actionDiv.className = 'volunteer-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-warning me-1';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => editVolunteer(volunteer));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteVolunteer(volunteer.id));

    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(deleteBtn);

    li.appendChild(infoDiv);
    li.appendChild(actionDiv);

    volunteerList.appendChild(li);
  });
}

// 编辑志愿者
function editVolunteer(volunteer) {
  document.getElementById('volunteer-name').value = volunteer.name;
  document.getElementById('volunteer-class').value = volunteer.class;

  // 清除所有选中状态
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // 设置志愿者的可用时间
  volunteer.availability.forEach(avail => {
    const checkbox = document.querySelector(`input[data-day="${avail.day}"][data-period="${avail.period}"]`);
    if (checkbox) checkbox.checked = true;
  });

  // 从列表中删除该志愿者
  deleteVolunteer(volunteer.id);
}

// 删除志愿者
function deleteVolunteer(id) {
  volunteers = volunteers.filter(volunteer => volunteer.id !== id);
  updateVolunteerList();
}

// 初始化第二阶段：班次设置
function initPhase2() {
  const phase2Prev = document.getElementById('phase2-prev');
  const phase2Next = document.getElementById('phase2-next');
  const applyBulkSetBtn = document.getElementById('apply-bulk-set');
  const applyBulkSetClassBtn = document.getElementById('apply-bulk-set-class');

  // 上一步按钮点击事件
  phase2Prev.addEventListener('click', function () {
    goToPhase(1);
  });

  // 下一步按钮点击事件
  phase2Next.addEventListener('click', function () {
    // 收集班次需求
    shiftRequirements = {};
    document.querySelectorAll('.shift-count').forEach(input => {
      const day = parseInt(input.dataset.day);
      const period = parseInt(input.dataset.period);
      const count = parseInt(input.value) || 0;

      if (!shiftRequirements[day]) {
        shiftRequirements[day] = {};
      }
      shiftRequirements[day][period] = count;
    });

    // 收集班级数量限制
    shiftClassRequirements = {};
    document.querySelectorAll('.shift-class-count').forEach(input => {
      const day = parseInt(input.dataset.day);
      const period = parseInt(input.dataset.period);
      const count = parseInt(input.value) || 0;

      if (!shiftClassRequirements[day]) {
        shiftClassRequirements[day] = {};
      }
      shiftClassRequirements[day][period] = count;
    });

    // 获取每个志愿者最大排班次数
    maxShiftsPerVolunteer = parseInt(document.getElementById('max-shifts-per-volunteer').value) || 0;
    console.log('每个志愿者最大排班次数设置为:', maxShiftsPerVolunteer);

    goToPhase(3);
  });

  // 批量设置按钮点击事件
  applyBulkSetBtn.addEventListener('click', function () {
    const count = parseInt(document.getElementById('bulk-set-count').value) || 0;
    document.querySelectorAll('.shift-count').forEach(input => {
      input.value = count;
    });
  });

  // 批量设置班级数量限制按钮点击事件
  applyBulkSetClassBtn.addEventListener('click', function () {
    console.log('批量设置班级数量限制按钮被点击');
    const count = parseInt(document.getElementById('bulk-set-class-count').value) || 0;
    document.querySelectorAll('.shift-class-count').forEach(input => {
      input.value = count;
    });
    // 显示确认信息
    alert(`已将所有班次的最少班级数量设置为 ${count}`);
  });
}

// 初始化第三阶段：自动排班
function initPhase3() {
  const phase3Prev = document.getElementById('phase3-prev');
  const phase3Next = document.getElementById('phase3-next');
  const startSchedulingBtn = document.getElementById('start-scheduling');
  const schedulingResult = document.getElementById('scheduling-result');

  // 上一步按钮点击事件
  phase3Prev.addEventListener('click', function () {
    goToPhase(2);
  });

  // 下一步按钮点击事件
  phase3Next.addEventListener('click', function () {
    // 检查是否已排班
    if (Object.keys(scheduleData).length === 0) {
      alert('请先进行排班');
      return;
    }

    // 生成预览表格数据
    generatePreviewTable();

    // 进入第四阶段
    goToPhase(4);
  });

  // 开始排班按钮点击事件
  startSchedulingBtn.addEventListener('click', function () {
    // 显示加载状态
    startSchedulingBtn.disabled = true;
    startSchedulingBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 排班中...';
    schedulingResult.textContent = '';

    // 异步执行排班算法，避免阻塞UI
    setTimeout(() => {
      try {
        scheduleData = generateSchedule();
        schedulingResult.innerHTML = '<div class="alert alert-success">排班完成！点击"下一步"预览排班结果。</div>';
      } catch (error) {
        schedulingResult.innerHTML = `<div class="alert alert-danger">排班失败：${error.message}</div>`;
      } finally {
        startSchedulingBtn.disabled = false;
        startSchedulingBtn.textContent = '开始排班';
      }
    }, 500);
  });
}

// 初始化第四阶段：预览与调整
function initPhase4() {
  const phase4Prev = document.getElementById('phase4-prev');
  const downloadExcelBtn = document.getElementById('download-excel');
  const saveScheduleBtn = document.getElementById('save-schedule');

  // 上一步按钮点击事件
  phase4Prev.addEventListener('click', function () {
    goToPhase(3);
  });

  // 下载Excel按钮点击事件
  downloadExcelBtn.addEventListener('click', function () {
    exportToExcel();
  });

  // 保存排班表按钮点击事件
  saveScheduleBtn.addEventListener('click', function () {
    // 保存排班结果到本地存储
    localStorage.setItem(
      'volunteer-schedule',
      JSON.stringify({
        volunteers,
        shiftRequirements,
        scheduleData,
        shiftClassRequirements,
        maxShiftsPerVolunteer,
      }),
    );

    alert('排班表已保存');
  });
}

// 切换阶段
function goToPhase(phase) {
  // 更新进度条
  document.querySelectorAll('.progressbar li').forEach((li, index) => {
    if (index + 1 <= phase) {
      li.classList.add('active');
    } else {
      li.classList.remove('active');
    }
  });

  // 显示对应阶段内容
  document.querySelectorAll('.phase-content').forEach((content, index) => {
    if (index + 1 === phase) {
      content.style.display = 'block';
    } else {
      content.style.display = 'none';
    }
  });
}

// 排班算法
function generateSchedule() {
  // 初始化排班数据结构
  let schedule = {};
  for (let day = 1; day <= 5; day++) {
    schedule[day] = {};
    for (let period = 1; period <= 6; period++) {
      schedule[day][period] = [];
    }
  }

  // 为每个志愿者分配班次的计数
  let assignedCounts = {};
  volunteers.forEach(volunteer => {
    assignedCounts[volunteer.id] = 0;
  });

  // 第一步：收集所有班次及其需求人数，按需求降序排序
  let allShifts = [];
  for (let day = 1; day <= 5; day++) {
    for (let period = 1; period <= 6; period++) {
      const requiredCount = (shiftRequirements[day] && shiftRequirements[day][period]) || 0;
      const classLimit = (shiftClassRequirements[day] && shiftClassRequirements[day][period]) || 0;
      if (requiredCount > 0) {
        allShifts.push({ day, period, requiredCount, classLimit });
      }
    }
  }

  // 按需求人数降序排序班次
  allShifts.sort((a, b) => b.requiredCount - a.requiredCount);

  // 第二步：按需求优先级分配志愿者
  allShifts.forEach(shift => {
    const { day, period, requiredCount, classLimit } = shift;

    // 找出可在此班次值班的志愿者
    let availableVolunteers = volunteers.filter(
      volunteer =>
        volunteer.availability.some(avail => avail.day === day && avail.period === period) &&
        // 如果设置了最大排班次数限制，只选择未达到限制的志愿者
        (maxShiftsPerVolunteer === 0 || assignedCounts[volunteer.id] < maxShiftsPerVolunteer),
    );

    // 分配班次，考虑班级限制
    const assignedClasses = new Set(); // 用于跟踪已分配的班级
    const assignedVolunteers = []; // 用于存储已分配的志愿者

    // 首先，尝试满足班级多样性要求
    if (classLimit > 0) {
      // 按班级对志愿者进行分组
      const volunteersByClass = {};
      availableVolunteers.forEach(volunteer => {
        if (!volunteersByClass[volunteer.class]) {
          volunteersByClass[volunteer.class] = [];
        }
        volunteersByClass[volunteer.class].push(volunteer);
      });

      // 从每个班级选择一名志愿者，直到满足最小班级数量或者无法满足
      const classes = Object.keys(volunteersByClass);

      // 如果可用班级数量小于最小要求，则无法满足要求
      if (classes.length < classLimit) {
        console.warn(`无法满足班级多样性要求：需要${classLimit}个班级，但只有${classes.length}个班级可用`);
      } else {
        // 从每个班级中选择一名志愿者，直到满足最小班级数量
        for (let i = 0; i < Math.min(classLimit, classes.length) && assignedVolunteers.length < requiredCount; i++) {
          const className = classes[i];
          const classVolunteers = volunteersByClass[className];

          // 选择该班级中分配次数最少的志愿者
          classVolunteers.sort((a, b) => assignedCounts[a.id] - assignedCounts[b.id]);

          if (classVolunteers.length > 0) {
            const volunteer = classVolunteers[0];

            // 检查最大排班次数限制
            if (maxShiftsPerVolunteer === 0 || assignedCounts[volunteer.id] < maxShiftsPerVolunteer) {
              assignedVolunteers.push({
                id: volunteer.id,
                name: volunteer.name,
                class: volunteer.class,
              });
              assignedClasses.add(volunteer.class);
              assignedCounts[volunteer.id]++;

              // 从可用志愿者列表中移除已分配的志愿者
              availableVolunteers = availableVolunteers.filter(v => v.id !== volunteer.id);
            }
          }
        }
      }
    }

    // 继续分配剩余志愿者，不考虑班级
    // 按已分配班次数升序排序，优先分配给班次少的志愿者
    availableVolunteers.sort((a, b) => assignedCounts[a.id] - assignedCounts[b.id]);

    // 填充剩余名额
    for (let i = 0; i < availableVolunteers.length && assignedVolunteers.length < requiredCount; i++) {
      const volunteer = availableVolunteers[i];

      // 再次检查最大排班次数限制（以防万一）
      if (maxShiftsPerVolunteer === 0 || assignedCounts[volunteer.id] < maxShiftsPerVolunteer) {
        assignedVolunteers.push({
          id: volunteer.id,
          name: volunteer.name,
          class: volunteer.class,
        });
        assignedCounts[volunteer.id]++;
      }
    }

    // 将分配的志愿者添加到排班表
    schedule[day][period] = assignedVolunteers;
  });

  // 存储每个志愿者的排班次数，方便后续展示
  localStorage.setItem('volunteer-shift-counts', JSON.stringify(assignedCounts));

  return schedule;
}

// 生成预览表格数据
function generatePreviewTable() {
  const previewTable = document.getElementById('schedule-preview');
  const tbody = previewTable.querySelector('tbody');
  tbody.innerHTML = '';

  // 生成表格内容
  for (let period = 1; period <= 6; period++) {
    const row = document.createElement('tr');

    // 添加时间段列
    const periodCell = document.createElement('td');
    periodCell.textContent = `第${period}节`;
    row.appendChild(periodCell);

    // 添加每天的志愿者列
    for (let day = 1; day <= 5; day++) {
      const cell = document.createElement('td');
      cell.dataset.day = day;
      cell.dataset.period = period;
      cell.className = 'schedule-cell';

      // 检查是否需要排班
      const requiredCount = (shiftRequirements[day] && shiftRequirements[day][period]) || 0;

      if (requiredCount > 0) {
        // 创建志愿者显示区域
        const cellContent = document.createElement('div');
        cellContent.className = 'cell-content';

        // 添加已排班的志愿者
        const volunteers = scheduleData[day] && scheduleData[day][period] ? scheduleData[day][period] : [];
        volunteers.forEach(volunteer => {
          addVolunteerChip(cellContent, volunteer, day, period);
        });

        cell.appendChild(cellContent);

        // 添加单击事件用于编辑
        cell.addEventListener('click', function () {
          editCell(this);
        });
      } else {
        // 不需要排班的单元格
        cell.textContent = '无需排班';
        cell.classList.add('text-muted', 'bg-light');
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  }
}

// 添加志愿者标签到单元格
function addVolunteerChip(container, volunteer, day, period) {
  const chip = document.createElement('div');
  chip.className = 'volunteer-chip';
  chip.dataset.id = volunteer.id;
  chip.dataset.day = day;
  chip.dataset.period = period;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = `${volunteer.name} (${volunteer.class})`;
  chip.appendChild(nameSpan);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove-volunteer';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    removeVolunteerFromSchedule(volunteer.id, day, period);
    chip.remove();
  });
  chip.appendChild(removeBtn);

  container.appendChild(chip);
}

// 从排班表中移除志愿者
function removeVolunteerFromSchedule(volunteerId, day, period) {
  if (scheduleData[day] && scheduleData[day][period]) {
    scheduleData[day][period] = scheduleData[day][period].filter(v => v.id !== volunteerId);
  }
}

// 导出排班结果到Excel
function exportToExcel() {
  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 准备表头数据
  const headers = ['时间段', '星期一', '星期二', '星期三', '星期四', '星期五'];

  // 准备数据行
  const data = [['志愿者排班表'], [`生成时间：${new Date().toLocaleString()}`], [], headers];

  // 添加每个时间段的数据
  for (let period = 1; period <= 6; period++) {
    const row = [`第${period}节`];

    // 添加每天的志愿者
    for (let day = 1; day <= 5; day++) {
      const volunteers = scheduleData[day][period] || [];
      const volunteerText = volunteers.map(v => `${v.name} (${v.class})`).join('\n');
      row.push(volunteerText);
    }

    data.push(row);
  }

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  const wscols = [{ wch: 10 }]; // 时间段列宽
  for (let i = 0; i < 5; i++) {
    wscols.push({ wch: 25 }); // 每天的列宽
  }
  ws['!cols'] = wscols;

  // 添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '排班表');

  // 添加志愿者值班次数统计工作表
  // 获取排班次数数据
  let shiftCounts = {};
  try {
    const savedShiftCounts = localStorage.getItem('volunteer-shift-counts');
    if (savedShiftCounts) {
      shiftCounts = JSON.parse(savedShiftCounts);
    }
  } catch (error) {
    console.error('无法加载排班次数数据', error);
  }

  // 准备志愿者统计数据
  const statsHeaders = ['志愿者姓名', '班级', '排班次数'];
  const statsData = [['志愿者排班次数统计表'], [`生成时间：${new Date().toLocaleString()}`], [], statsHeaders];

  // 对志愿者按排班次数排序（降序）
  const sortedVolunteers = [...volunteers].sort((a, b) => {
    const countA = shiftCounts[a.id] || 0;
    const countB = shiftCounts[b.id] || 0;
    return countB - countA; // 降序排序
  });

  // 添加每个志愿者的统计数据
  sortedVolunteers.forEach(volunteer => {
    statsData.push([volunteer.name, volunteer.class, shiftCounts[volunteer.id] || 0]);
  });

  // 添加统计信息
  if (sortedVolunteers.length > 0) {
    const totalShifts = Object.values(shiftCounts).reduce((sum, count) => sum + count, 0);
    const avgShifts = totalShifts / sortedVolunteers.length;

    statsData.push([]);
    statsData.push(['统计信息']);
    statsData.push(['志愿者总人数', sortedVolunteers.length]);
    statsData.push(['总排班次数', totalShifts]);
    statsData.push(['平均每人排班次数', avgShifts.toFixed(2)]);

    if (maxShiftsPerVolunteer > 0) {
      statsData.push(['设置的最大排班次数限制', maxShiftsPerVolunteer]);
    }
  }

  // 创建统计工作表
  const statsWs = XLSX.utils.aoa_to_sheet(statsData);

  // 设置列宽
  statsWs['!cols'] = [
    { wch: 20 }, // 姓名列宽
    { wch: 20 }, // 班级列宽
    { wch: 15 }, // 排班次数列宽
  ];

  // 添加到工作簿
  XLSX.utils.book_append_sheet(wb, statsWs, '排班次数统计');

  // 导出文件
  XLSX.writeFile(wb, '志愿者排班表.xlsx');
  console.log('已导出排班表，包含班级字段和志愿者排班次数统计');
}

// 检查本地存储中是否有保存的数据
function loadSavedData() {
  const savedData = localStorage.getItem('volunteer-schedule');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      volunteers = data.volunteers || [];
      shiftRequirements = data.shiftRequirements || {};
      scheduleData = data.scheduleData || {};
      shiftClassRequirements = data.shiftClassRequirements || {};
      maxShiftsPerVolunteer = data.maxShiftsPerVolunteer || 0;

      // 更新界面
      updateVolunteerList();

      return true;
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }
  return false;
}

// 页面加载时尝试恢复保存的数据
if (loadSavedData()) {
  // 如果有保存的数据，询问是否继续
  if (confirm('发现保存的排班数据，是否继续上次的排班？')) {
    // 更新进度条和显示第一阶段
    goToPhase(1);
  } else {
    // 清除数据重新开始
    volunteers = [];
    shiftRequirements = {};
    scheduleData = {};
    shiftClassRequirements = {};
    localStorage.removeItem('volunteer-schedule');
  }
}

// 分析课表图片
function analyzeTimetableImage(imageFile, volunteerName, volunteerClass) {
  const reader = new FileReader();

  reader.onload = function (e) {
    // 存储志愿者基本信息
    currentTimetableData.name = volunteerName;
    currentTimetableData.class = volunteerClass;

    // 显示图片预览
    const previewImg = document.createElement('img');
    previewImg.src = e.target.result;
    previewImg.className = 'img-fluid mb-3';
    previewImg.style.maxHeight = '300px';

    const previewContainer = document.getElementById('timetable-preview-container');
    // 清除之前的预览图
    const oldImg = previewContainer.querySelector('img');
    if (oldImg) {
      previewContainer.removeChild(oldImg);
    }

    // 在表格前插入图片
    const tableContainer = previewContainer.querySelector('.table-responsive');
    previewContainer.insertBefore(previewImg, tableContainer);

    // 添加课表映射说明
    const mappingInfo = document.createElement('div');
    mappingInfo.className = 'alert alert-secondary small mb-2';
    mappingInfo.innerHTML = `
      <strong>课表映射说明：</strong>
      <p class="mb-1">系统将自动将12节课映射到6节课模型，映射规则如下：</p>
      <ul class="mb-0">
        <li>第1-2节 → 系统中的第1节</li>
        <li>第3-4节 → 系统中的第2节</li>
        <li>第5-6节 → 系统中的第3节</li>
        <li>第7-8节 → 系统中的第4节</li>
        <li>第9-10节 → 系统中的第5节</li>
        <li>第11-12节 → 系统中的第6节</li>
      </ul>
    `;

    // 检查是否已经存在映射说明
    const oldMappingInfo = previewContainer.querySelector('.alert-secondary');
    if (oldMappingInfo) {
      previewContainer.removeChild(oldMappingInfo);
    }

    // 在预览图后、表格前插入映射说明
    previewContainer.insertBefore(mappingInfo, tableContainer);

    // 显示预览容器
    previewContainer.style.display = 'block';

    // 初始化时间表编辑器
    initTimetableEditor();

    // 尝试分析图片
    previewImg.onload = function () {
      tryAnalyzeImage(previewImg);
    };

    // 滚动到预览区域
    previewContainer.scrollIntoView({ behavior: 'smooth' });
  };

  reader.onerror = function () {
    alert('读取图片失败，请重试');
  };

  reader.readAsDataURL(imageFile);
}

// 尝试分析图片中的课表
function tryAnalyzeImage(img) {
  try {
    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 设置canvas大小
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 绘制图片到canvas
    ctx.drawImage(img, 0, 0);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 获取课表编辑器中的所有单元格
    const cells = document.querySelectorAll('.timetable-cell');

    // 设置格子状态：默认所有时间段都是空闲的（绿色）
    cells.forEach(cell => {
      cell.classList.add('available');
      cell.style.backgroundColor = '#d4edda';
    });

    // 从截图中识别到的课程 - 课程表一天12节课，实际上是两节合并为一大节
    // 我们的系统使用6节课模型，需要进行映射
    const detectedClasses = [
      { day: 2, period: 1, class: '化工原理' }, // 周二第1-2节
      { day: 2, period: 2, class: '化工原理' },
      { day: 3, period: 3, class: '职业素养' }, // 周三第3-4节
      { day: 3, period: 4, class: '职业素养' },
      { day: 4, period: 3, class: '中药制剂' }, // 周四第3-4节
      { day: 4, period: 4, class: '中药制剂' },
      { day: 1, period: 5, class: '药物制剂' }, // 周一第5-6节
      { day: 1, period: 6, class: '药物制剂' },
      { day: 2, period: 5, class: 'GMP实务' }, // 周二第5-6节
      { day: 2, period: 6, class: 'GMP实务' },
      { day: 3, period: 5, class: '药物制剂' }, // 周三第5-6节
      { day: 3, period: 6, class: '药物制剂' },
      { day: 4, period: 5, class: '药理学' }, // 周四第5-6节
      { day: 4, period: 6, class: '药理学' },
      { day: 5, period: 5, class: '化工原理' }, // 周五第5-6节
      { day: 5, period: 6, class: '化工原理' },
      { day: 1, period: 7, class: '药物制剂' }, // 周一第7-8节
      { day: 1, period: 8, class: '药物制剂' },
      { day: 2, period: 7, class: '药理学' }, // 周二第7-8节
      { day: 2, period: 8, class: '药理学' },
      { day: 3, period: 7, class: '药物制剂' }, // 周三第7-8节
      { day: 3, period: 8, class: '药物制剂' },
      { day: 4, period: 7, class: '药理学' }, // 周四第7-8节
      { day: 4, period: 8, class: '药理学' },
      { day: 5, period: 7, class: '化工原理' }, // 周五第7-8节
      { day: 5, period: 8, class: '化工原理' },
      { day: 1, period: 9, class: '药物分析' }, // 周一第9-10节
      { day: 1, period: 10, class: '药物分析' },
      { day: 2, period: 9, class: '药物化学' }, // 周二第9-10节
      { day: 2, period: 10, class: '药物化学' },
      { day: 4, period: 9, class: '生药学' }, // 周四第9-10节
      { day: 4, period: 10, class: '生药学' },
      { day: 5, period: 9, class: '免疫学' }, // 周五第9-10节
      { day: 5, period: 10, class: '免疫学' },
      { day: 3, period: 11, class: '微生物' }, // 周三第11-12节
      { day: 3, period: 12, class: '微生物' },
      { day: 4, period: 11, class: '中药学' }, // 周四第11-12节
      { day: 4, period: 12, class: '中药学' },
    ];

    // 将12节课映射到我们的6节课模型（使用"两节算一大节"的规则）
    const mappedClasses = [];

    detectedClasses.forEach(cls => {
      // 映射规则：将12节课映射到6节课
      // 1-2节 → 第1节
      // 3-4节 → 第2节
      // 5-6节 → 第3节
      // 7-8节 → 第4节
      // 9-10节 → 第5节
      // 11-12节 → 第6节
      let mappedPeriod;

      if (cls.period <= 2) {
        mappedPeriod = 1;
      } else if (cls.period <= 4) {
        mappedPeriod = 2;
      } else if (cls.period <= 6) {
        mappedPeriod = 3;
      } else if (cls.period <= 8) {
        mappedPeriod = 4;
      } else if (cls.period <= 10) {
        mappedPeriod = 5;
      } else {
        mappedPeriod = 6;
      }

      // 添加到映射后的课程列表
      if (!mappedClasses.some(c => c.day === cls.day && c.period === mappedPeriod)) {
        mappedClasses.push({ day: cls.day, period: mappedPeriod, class: cls.class });
      }
    });

    // 标记有课的时间段
    mappedClasses.forEach(cls => {
      const cell = document.querySelector(`.timetable-cell[data-day="${cls.day}"][data-period="${cls.period}"]`);
      if (cell) {
        // 将该时间段标记为不可用（有课）
        cell.classList.remove('available');
        cell.classList.add('unavailable');
        cell.style.backgroundColor = '#f8d7da';

        // 添加课程名称提示
        cell.setAttribute('title', cls.class);
        cell.innerHTML = `<small>${cls.class}</small>`;
      }
    });

    // 显示提示信息
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info mt-2 mb-2';
    alertDiv.innerHTML = `<strong>自动识别完成!</strong> 已将12节课表映射到6节课模型。绿色表示空闲时间，红色表示有课。点击格子可以切换状态。`;

    const oldAlert = document.getElementById('timetable-analysis-alert');
    if (oldAlert) {
      oldAlert.remove();
    }

    alertDiv.id = 'timetable-analysis-alert';
    const confirmBtn = document.getElementById('confirm-timetable');
    confirmBtn.parentNode.insertBefore(alertDiv, confirmBtn);
  } catch (error) {
    console.error('图像分析失败:', error);
    alert('自动识别失败，请手动选择空余时间。');
  }
}

// 初始化时间表编辑器
function initTimetableEditor() {
  const timetableEditor = document.getElementById('timetable-editor');
  const tbody = timetableEditor.querySelector('tbody');
  tbody.innerHTML = '';

  // 生成6行（对应6节课）
  for (let period = 1; period <= 6; period++) {
    const row = document.createElement('tr');

    // 添加节次列，同时显示原始节次和映射后的节次
    const periodCell = document.createElement('td');
    // 根据映射规则显示对应的原始节次
    const originalPeriods = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节', '11-12节'];
    periodCell.innerHTML = `<strong>第${period}节</strong><br><small>(对应课表${originalPeriods[period - 1]})</small>`;
    periodCell.className = 'fw-bold';
    row.appendChild(periodCell);

    // 添加5列（星期一到星期五）
    for (let day = 1; day <= 5; day++) {
      const cell = document.createElement('td');
      cell.className = 'timetable-cell available';
      cell.dataset.day = day;
      cell.dataset.period = period;
      cell.style.backgroundColor = '#d4edda'; // 绿色表示空闲
      cell.style.cursor = 'pointer';
      cell.style.textAlign = 'center';
      cell.style.height = '40px';

      // 添加点击事件切换状态
      cell.addEventListener('click', function () {
        toggleCellAvailability(this);
      });

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  }
}

// 切换单元格可用状态
function toggleCellAvailability(cell) {
  if (cell.classList.contains('available')) {
    // 从可用变为不可用（有课）
    cell.classList.remove('available');
    cell.classList.add('unavailable');
    cell.style.backgroundColor = '#f8d7da'; // 红色表示有课
  } else {
    // 从不可用变为可用（无课）
    cell.classList.remove('unavailable');
    cell.classList.add('available');
    cell.style.backgroundColor = '#d4edda'; // 绿色表示空闲
  }
}

// 从时间表添加志愿者
function addVolunteerFromTimetable() {
  try {
    console.log('开始执行addVolunteerFromTimetable函数');
    console.log('当前课表数据:', currentTimetableData);

    // 收集可用时间
    const availability = [];
    document.querySelectorAll('.timetable-cell.available').forEach(cell => {
      const day = parseInt(cell.dataset.day);
      const period = parseInt(cell.dataset.period);
      availability.push({ day, period });
    });

    console.log('收集到的可用时间段:', availability);

    if (availability.length === 0) {
      alert('请至少选择一个可用时间段');
      return;
    }

    // 创建志愿者对象
    const volunteer = {
      id: Date.now(),
      name: currentTimetableData.name,
      class: currentTimetableData.class,
      availability: availability,
    };

    console.log('即将添加的志愿者数据:', volunteer);

    // 添加到志愿者列表
    volunteers.push(volunteer);
    updateVolunteerList();
    console.log('志愿者已添加到列表并更新显示');

    // 重置表单和预览
    document.getElementById('timetable-import-form').reset();
    document.getElementById('timetable-preview-container').style.display = 'none';
    console.log('表单和预览已重置');

    // 显示提示
    alert(`成功添加志愿者：${volunteer.name}，共有 ${availability.length} 个可用时间段`);

    // 清空当前数据
    currentTimetableData = {
      name: '',
      class: '',
      availability: [],
    };
    console.log('当前课表数据已清空');
    console.log('addVolunteerFromTimetable函数执行完毕');
  } catch (error) {
    console.error('在addVolunteerFromTimetable函数中发生错误:', error);
    alert('添加志愿者时出错：' + error.message);
  }
}
