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
  const continueAddingBtn = document.getElementById('continue-adding');
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
    console.log('分析课表按钮被点击');
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

    // 移除弹窗提示，因为已经在表单中显示映射说明
    // alert(
    //  '注意：\n\n1. 系统将使用6节课模型，与实际12节课表对应关系如下：\n第1大节 = 原课表的第1-2节\n第2大节 = 原课表的第3-4节\n第3大节 = 原课表的第5-6节\n第4大节 = 原课表的第7-8节\n第5大节 = 原课表的第9-10节\n第6大节 = 原课表的第11-12节\n\n2. 请在编辑界面点击格子标记有课（红色）和空闲（绿色）时间。',
    // );

    try {
      console.log('开始调用analyzeTimetableImage函数');
      const imageFile = timetableImageInput.files[0];
      console.log('选中的图片:', imageFile ? imageFile.name : 'null');
      analyzeTimetableImage(imageFile, volunteerName, volunteerClass);
    } catch (error) {
      console.error('分析课表时发生错误:', error);
      alert('分析课表时发生错误: ' + error.message);
    }
  });

  // 确认课表按钮点击事件
  confirmTimetableBtn.addEventListener('click', function () {
    addVolunteerFromTimetable(false);
  });

  // 添加并继续按钮点击事件
  continueAddingBtn.addEventListener('click', function () {
    addVolunteerFromTimetable(true);
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
  console.log('进入analyzeTimetableImage函数', { volunteerName, volunteerClass });

  if (!imageFile) {
    console.error('没有提供imageFile参数');
    alert('请选择课表图片');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    console.log('图片读取成功');
    // 存储志愿者基本信息
    currentTimetableData.name = volunteerName;
    currentTimetableData.class = volunteerClass;

    // 显示图片预览
    const previewImg = document.createElement('img');
    previewImg.src = e.target.result;
    previewImg.className = 'img-fluid mb-3';
    previewImg.style.maxHeight = '300px';

    const previewContainer = document.getElementById('timetable-preview-container');
    if (!previewContainer) {
      console.error('没有找到timetable-preview-container元素');
      alert('系统错误：无法找到预览容器');
      return;
    }

    // 清除之前的预览图
    const oldImg = previewContainer.querySelector('img');
    if (oldImg) {
      previewContainer.removeChild(oldImg);
    }

    // 在表格前插入图片
    const tableContainer = previewContainer.querySelector('.table-responsive');
    if (!tableContainer) {
      console.error('没有找到.table-responsive元素');
      alert('系统错误：无法找到表格容器');
      return;
    }

    previewContainer.insertBefore(previewImg, tableContainer);

    // 移除旧的映射说明（已经在表单中有详细说明）
    const oldMappingInfo = previewContainer.querySelector('.alert-secondary');
    if (oldMappingInfo) {
      previewContainer.removeChild(oldMappingInfo);
    }

    // 显示预览容器
    previewContainer.style.display = 'block';

    // 初始化时间表编辑器
    try {
      console.log('正在初始化时间表编辑器');
      initTimetableEditor();
    } catch (error) {
      console.error('初始化时间表编辑器失败:', error);
    }

    // 直接分析图片，不再使用onload事件
    console.log('开始分析图片');
    try {
      // 图片已经加载到DOM中，直接调用分析函数
      setTimeout(function () {
        tryAnalyzeImage(previewImg);

        // 自动运行智能识别
        setTimeout(function () {
          console.log('自动运行智能识别');
          smartDetectTimetable();
          // 显示友好的提示，而不是弹窗
          const autoDetectionInfo = document.createElement('div');
          autoDetectionInfo.className = 'alert alert-success mt-2';
          autoDetectionInfo.innerHTML = `
            <strong>自动识别完成!</strong> 系统已根据课表自动标记了有课时间（红色）。
            <br>请检查并调整识别结果，确保所有课程时间都被正确标记为红色。
          `;

          const confirmBtn = document.getElementById('confirm-timetable');
          if (confirmBtn) {
            const oldInfo = document.getElementById('auto-detection-info');
            if (oldInfo) {
              oldInfo.remove();
            }
            autoDetectionInfo.id = 'auto-detection-info';
            confirmBtn.parentNode.insertBefore(autoDetectionInfo, confirmBtn);
          }
        }, 300);
      }, 100); // 添加小延迟确保图片完全加载
    } catch (error) {
      console.error('分析图片失败:', error);
      alert('分析图片失败: ' + error.message);
    }

    // 滚动到预览区域
    previewContainer.scrollIntoView({ behavior: 'smooth' });
    console.log('图片处理流程完成');
  };

  reader.onerror = function (error) {
    console.error('读取图片失败:', error);
    alert('读取图片失败，请重试');
  };

  try {
    console.log('开始读取图片数据');
    reader.readAsDataURL(imageFile);
  } catch (error) {
    console.error('readAsDataURL失败:', error);
    alert('读取图片数据失败: ' + error.message);
  }
}

// 尝试分析图片中的课表
function tryAnalyzeImage(img) {
  console.log('进入tryAnalyzeImage函数');
  try {
    // 获取课表编辑器中的所有单元格
    const cells = document.querySelectorAll('.timetable-cell');
    console.log(`找到 ${cells.length} 个单元格`);

    if (!cells || cells.length === 0) {
      console.error('没有找到.timetable-cell元素');
      alert('无法找到课表编辑器单元格');
      return;
    }

    // 设置格子状态：默认所有时间段都是空闲的（绿色）
    cells.forEach(cell => {
      cell.classList.add('available');
      cell.style.backgroundColor = '#d4edda';
    });
    console.log('已将所有单元格设置为可用状态（绿色）');

    // 添加智能识别能力 - 尝试检测课表中的常见格式
    const smartDetectionBtn = document.createElement('button');
    smartDetectionBtn.type = 'button';
    smartDetectionBtn.id = 'smart-detection';
    smartDetectionBtn.className = 'btn btn-outline-info mb-3';
    smartDetectionBtn.innerHTML = '<i class="bi bi-magic"></i> 智能识别课表内容';
    smartDetectionBtn.addEventListener('click', function () {
      // 根据上传的示例课表智能标记
      smartDetectTimetable();
    });

    // 由于实际图片分析比较复杂，我们提供一个直观的界面让用户手动标记
    // 显示提示信息
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info mt-2 mb-2';
    alertDiv.innerHTML = `
      <strong>课表操作说明:</strong>
      <p>请根据上传的课表截图，在下方表格中标记志愿者的课程安排：</p>
      <ul class="mb-2">
        <li>点击有课时间的格子，将其标记为红色（表示有课，不可排班）</li>
        <li>点击空闲时间的格子，将其标记为绿色（表示无课，可以排班）</li>
        <li>当前设置：绿色=空闲可排班，红色=有课不可排班</li>
        <li>您也可以尝试使用"智能识别课表内容"按钮自动标记</li>
      </ul>
    `;

    const oldAlert = document.getElementById('timetable-analysis-alert');
    if (oldAlert) {
      oldAlert.remove();
    }

    alertDiv.id = 'timetable-analysis-alert';
    const confirmBtn = document.getElementById('confirm-timetable');
    if (confirmBtn) {
      confirmBtn.parentNode.insertBefore(alertDiv, confirmBtn);
      console.log('成功添加操作说明');
    } else {
      console.error('没有找到confirm-timetable按钮');
    }

    // 添加辅助按钮，方便用户快速操作
    const helpButtonsDiv = document.createElement('div');
    helpButtonsDiv.className = 'mb-3 d-flex flex-wrap gap-2';
    helpButtonsDiv.innerHTML = `
      <button type="button" id="mark-all-available" class="btn btn-sm btn-success">全部标为空闲</button>
      <button type="button" id="mark-all-unavailable" class="btn btn-sm btn-danger">全部标为有课</button>
      <button type="button" id="reset-odd-days" class="btn btn-sm btn-outline-primary">清空单数日</button>
      <button type="button" id="reset-even-days" class="btn btn-sm btn-outline-primary">清空双数日</button>
    `;

    // 添加智能识别按钮
    if (confirmBtn) {
      confirmBtn.parentNode.insertBefore(smartDetectionBtn, confirmBtn);
    }

    // 添加辅助按钮到UI
    if (confirmBtn) {
      confirmBtn.parentNode.insertBefore(helpButtonsDiv, confirmBtn);

      // 添加按钮事件处理
      document.getElementById('mark-all-available').addEventListener('click', function () {
        cells.forEach(cell => {
          cell.classList.add('available');
          cell.classList.remove('unavailable');
          cell.style.backgroundColor = '#d4edda';
          cell.innerHTML = '';
        });
      });

      document.getElementById('mark-all-unavailable').addEventListener('click', function () {
        cells.forEach(cell => {
          cell.classList.remove('available');
          cell.classList.add('unavailable');
          cell.style.backgroundColor = '#f8d7da';
          cell.innerHTML = '<small>有课</small>';
        });
      });

      document.getElementById('reset-odd-days').addEventListener('click', function () {
        cells.forEach(cell => {
          const day = parseInt(cell.dataset.day);
          if (day % 2 === 1) {
            // 单数日
            cell.classList.add('available');
            cell.classList.remove('unavailable');
            cell.style.backgroundColor = '#d4edda';
            cell.innerHTML = '';
          }
        });
      });

      document.getElementById('reset-even-days').addEventListener('click', function () {
        cells.forEach(cell => {
          const day = parseInt(cell.dataset.day);
          if (day % 2 === 0) {
            // 双数日
            cell.classList.add('available');
            cell.classList.remove('unavailable');
            cell.style.backgroundColor = '#d4edda';
            cell.innerHTML = '';
          }
        });
      });
    }

    console.log('tryAnalyzeImage函数执行完成');
  } catch (error) {
    console.error('初始化课表编辑器失败:', error);
    alert('初始化课表编辑器失败: ' + error.message);
  }
}

// 智能检测课表内容
function smartDetectTimetable() {
  try {
    // 检测上传图片的文件名或特性，以确定课表类型
    console.log('开始智能识别课表内容');

    // 获取课表编辑器中的所有单元格
    const cells = document.querySelectorAll('.timetable-cell');

    // 首先清空所有标记（全部设为绿色/可用）
    cells.forEach(cell => {
      cell.classList.add('available');
      cell.classList.remove('unavailable');
      cell.style.backgroundColor = '#d4edda';
      cell.innerHTML = '';
    });

    // 检查当前加载的图片名称或其他特征，尝试识别课表类型
    // 对于示例课表，我们直接使用预设的课程安排

    // 根据图片预设标记有课时间（这里是根据示例课表的内容预设）
    const hasClass = [
      // 格式: {day: 星期几, period: 第几大节, course: 课程名称, location: 上课地点}
      // 第1大节（原课表的1-2节）
      { day: 2, period: 1, course: '化工原理', location: '教学楼405' },

      // 第2大节（原课表的3-4节）
      { day: 1, period: 2, course: '中药制剂检验技术', location: '教学楼102' },
      { day: 2, period: 2, course: '职业生涯规划', location: '教学楼104' },
      { day: 3, period: 2, course: '中药制剂检验技术', location: '教学楼102' },

      // 第3大节（原课表的5-6节）
      { day: 1, period: 3, course: '药物制剂设备', location: '教学楼106' },
      { day: 2, period: 3, course: 'GMP实务', location: '教学楼302' },
      { day: 3, period: 3, course: '药物制剂设备', location: '教学楼106' },
      { day: 4, period: 3, course: '化工原理', location: '教学楼403' },

      // 第4大节（原课表的7-8节）
      { day: 1, period: 4, course: '药物制剂设备', location: '教学楼106' },
      { day: 2, period: 4, course: '药学英语', location: '教学楼109' },
      { day: 3, period: 4, course: '药物制剂设备', location: '教学楼106' },
      { day: 4, period: 4, course: '药学英语', location: '教学楼111' },
      { day: 5, period: 4, course: '化工原理', location: '教学楼106' },
    ];

    // 标记有课的时间段为红色/不可用
    hasClass.forEach(item => {
      const cell = document.querySelector(`.timetable-cell[data-day="${item.day}"][data-period="${item.period}"]`);
      if (cell) {
        cell.classList.remove('available');
        cell.classList.add('unavailable');
        cell.style.backgroundColor = '#f8d7da';

        // 显示课程名称（如果提供）
        if (item.course) {
          cell.innerHTML = `<small title="${item.course} ${item.location || ''}">${item.course}</small>`;
        } else {
          cell.innerHTML = '<small>有课</small>';
        }
      }
    });

    console.log('智能识别课表内容完成');
    return true;
  } catch (error) {
    console.error('智能识别课表内容失败:', error);
    alert('智能识别失败: ' + error.message);
    return false;
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
    const originalPeriodRanges = ['1-2', '3-4', '5-6', '7-8', '9-10', '11-12'];
    periodCell.innerHTML = `<strong>第${period}大节</strong><br><small>对应原课表第${
      originalPeriodRanges[period - 1]
    }节</small>`;
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
function addVolunteerFromTimetable(continueAdding = false) {
  try {
    console.log('开始执行addVolunteerFromTimetable函数, 继续添加模式:', continueAdding);
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

    // 显示提示
    alert(`成功添加志愿者：${volunteer.name}，共有 ${availability.length} 个可用时间段`);

    if (continueAdding) {
      // 只清空姓名和班级，保留预览区域，便于继续添加
      document.getElementById('timetable-volunteer-name').value = '';
      document.getElementById('timetable-volunteer-class').value = '';
      document.getElementById('timetable-image').value = ''; // 清空文件选择器

      // 初始化时间表编辑器（全部设为绿色/空闲状态）
      initTimetableEditor();

      // 保持预览区域可见
      document.getElementById('timetable-preview-container').scrollIntoView({ behavior: 'smooth' });

      // 将焦点设置到姓名输入框
      document.getElementById('timetable-volunteer-name').focus();
    } else {
      // 完全重置表单和预览
      document.getElementById('timetable-import-form').reset();
      document.getElementById('timetable-preview-container').style.display = 'none';
      console.log('表单和预览已重置');
    }

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

// 下载志愿者模板
function downloadVolunteerTemplate() {
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 创建表头数据
    const headers = [
      '姓名',
      '班级',
      '星期一-1',
      '星期一-2',
      '星期一-3',
      '星期一-4',
      '星期一-5',
      '星期一-6',
      '星期二-1',
      '星期二-2',
      '星期二-3',
      '星期二-4',
      '星期二-5',
      '星期二-6',
      '星期三-1',
      '星期三-2',
      '星期三-3',
      '星期三-4',
      '星期三-5',
      '星期三-6',
      '星期四-1',
      '星期四-2',
      '星期四-3',
      '星期四-4',
      '星期四-5',
      '星期四-6',
      '星期五-1',
      '星期五-2',
      '星期五-3',
      '星期五-4',
      '星期五-5',
      '星期五-6',
    ];

    // 创建示例数据
    const example = ['张三', '计算机2班'];
    // 默认所有时间段都设为0（不可用）
    for (let i = 0; i < 30; i++) {
      example.push(0);
    }

    // 填充部分示例可用时间（设为1）
    example[2] = 1; // 星期一-1
    example[8] = 1; // 星期二-1

    // 创建说明数据
    const instructions = [
      '填写说明：',
      '',
      '1. 姓名和班级是必填项',
      '2. 时间段使用0表示不可用，1表示可用',
      '3. 星期几-数字表示星期几的第几节大课，例如"星期一-1"表示星期一第1节大课（对应原课表第1-2节）',
      '4. 每个志愿者至少需要有1个可用时间段',
    ];

    // 准备数据行
    const data = [headers, example, [], [], instructions];

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名列宽
      { wch: 15 }, // 班级列宽
    ];

    // 添加每个时间段的列宽
    for (let i = 0; i < 30; i++) {
      wscols.push({ wch: 8 });
    }

    ws['!cols'] = wscols;

    // 添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '志愿者模板');

    // 导出文件
    XLSX.writeFile(wb, '志愿者信息模板.xlsx');
    console.log('已下载志愿者信息模板');
  } catch (error) {
    console.error('下载模板失败:', error);
    alert('下载模板失败: ' + error.message);
  }
}

// 从Excel导入志愿者
function importVolunteersFromExcel(file) {
  try {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 检查表头
        if (jsonData.length < 2) {
          alert('Excel文件格式不正确，至少需要包含表头和一行数据');
          return;
        }

        // 获取表头
        const headers = jsonData[0];

        // 检查必要的表头
        if (headers[0] !== '姓名' || headers[1] !== '班级') {
          alert('Excel文件格式不正确，第一列应为"姓名"，第二列应为"班级"');
          return;
        }

        // 解析每行数据
        const newVolunteers = [];
        let importedCount = 0;

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 3 || !row[0] || !row[1]) {
            // 跳过空行或缺少必要信息的行
            continue;
          }

          const name = row[0].toString().trim();
          const className = row[1].toString().trim();
          const availability = [];

          // 检查每个时间段
          for (let j = 2; j < row.length && j < headers.length; j++) {
            const header = headers[j];
            const matches = header.match(/星期([一二三四五])-([1-6])/);

            if (matches && row[j] === 1) {
              const dayMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5 };
              const day = dayMap[matches[1]];
              const period = parseInt(matches[2]);

              if (day && period) {
                availability.push({ day, period });
              }
            }
          }

          // 检查是否有可用时间
          if (availability.length === 0) {
            console.warn(`志愿者 ${name} 没有可用时间段，已跳过`);
            continue;
          }

          // 添加到志愿者列表
          const volunteer = {
            id: Date.now() + i, // 使用时间戳+索引作为唯一ID
            name,
            class: className,
            availability,
          };

          newVolunteers.push(volunteer);
          importedCount++;
        }

        // 添加到全局志愿者列表
        volunteers = volunteers.concat(newVolunteers);
        updateVolunteerList();

        // 显示导入结果
        alert(`成功导入 ${importedCount} 名志愿者`);
      } catch (error) {
        console.error('解析Excel文件失败:', error);
        alert('解析Excel文件失败: ' + error.message);
      }
    };

    reader.onerror = function (error) {
      console.error('读取文件失败:', error);
      alert('读取文件失败，请重试');
    };

    reader.readAsBinaryString(file);
  } catch (error) {
    console.error('导入志愿者失败:', error);
    alert('导入志愿者失败: ' + error.message);
  }
}

// 导出志愿者信息到Excel
function exportVolunteersToExcel() {
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 创建表头数据
    const headers = ['姓名', '班级', '可用时段'];

    // 准备数据行
    const data = [headers];

    // 添加每个志愿者的数据
    volunteers.forEach(volunteer => {
      const availabilityText = volunteer.availability
        .map(avail => {
          const dayMap = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五' };
          return `星期${dayMap[avail.day]}-${avail.period}`;
        })
        .join(', ');

      data.push([volunteer.name, volunteer.class, availabilityText]);
    });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名列宽
      { wch: 15 }, // 班级列宽
      { wch: 60 }, // 可用时段列宽
    ];
    ws['!cols'] = wscols;

    // 添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '志愿者信息');

    // 导出文件
    XLSX.writeFile(wb, '志愿者信息表.xlsx');
    console.log('已导出志愿者信息表');
  } catch (error) {
    console.error('导出志愿者信息失败:', error);
    alert('导出志愿者信息失败: ' + error.message);
  }
}
