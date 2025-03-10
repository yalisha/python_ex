// 全局变量
let volunteers = []; // 志愿者列表
let shiftRequirements = {}; // 每个班次需要的志愿者人数
let scheduleData = {}; // 排班结果数据

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  initPhase1();
  initPhase2();
  initPhase3();
  initPhase4();
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

  // 添加志愿者表单提交
  volunteerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('volunteer-name').value.trim();
    if (!name) return;

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
      availability,
    };

    volunteers.push(volunteer);
    updateVolunteerList();

    // 重置表单
    volunteerForm.reset();
  });

  // 更新志愿者列表显示
  function updateVolunteerList() {
    volunteerList.innerHTML = '';

    volunteers.forEach(volunteer => {
      const li = document.createElement('li');
      li.className = 'list-group-item';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = volunteer.name;

      const availabilityInfo = document.createElement('span');
      availabilityInfo.className = 'badge bg-info';
      availabilityInfo.textContent = `${volunteer.availability.length} 个可用时段`;

      const actionDiv = document.createElement('div');
      actionDiv.className = 'volunteer-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-warning';
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', () => editVolunteer(volunteer));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', () => deleteVolunteer(volunteer.id));

      actionDiv.appendChild(editBtn);
      actionDiv.appendChild(deleteBtn);

      li.appendChild(nameSpan);
      li.appendChild(availabilityInfo);
      li.appendChild(actionDiv);

      volunteerList.appendChild(li);
    });
  }

  // 编辑志愿者
  function editVolunteer(volunteer) {
    document.getElementById('volunteer-name').value = volunteer.name;

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

  // 下载志愿者信息模板
  function downloadVolunteerTemplate() {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 准备表头数据
    const headers = [
      '志愿者姓名',
      '星期一-第1节',
      '星期一-第2节',
      '星期一-第3节',
      '星期一-第4节',
      '星期一-第5节',
      '星期一-第6节',
      '星期二-第1节',
      '星期二-第2节',
      '星期二-第3节',
      '星期二-第4节',
      '星期二-第5节',
      '星期二-第6节',
      '星期三-第1节',
      '星期三-第2节',
      '星期三-第3节',
      '星期三-第4节',
      '星期三-第5节',
      '星期三-第6节',
      '星期四-第1节',
      '星期四-第2节',
      '星期四-第3节',
      '星期四-第4节',
      '星期四-第5节',
      '星期四-第6节',
      '星期五-第1节',
      '星期五-第2节',
      '星期五-第3节',
      '星期五-第4节',
      '星期五-第5节',
      '星期五-第6节',
    ];

    // 添加注释和说明行
    const data = [
      ['志愿者排班系统 - 志愿者信息模板'],
      ["请在下方填写志愿者姓名和可用时间（在对应时间段填入'是'表示可用）"],
      [],
      headers,
      [
        '张三',
        '是',
        '',
        '是',
        '',
        '是',
        '',
        '',
        '是',
        '',
        '',
        '是',
        '',
        '是',
        '',
        '是',
        '',
        '是',
        '',
        '',
        '',
        '是',
        '',
        '是',
        '',
        '是',
        '',
        '是',
        '是',
        '',
        '',
      ],
      [
        '李四',
        '',
        '是',
        '',
        '是',
        '',
        '是',
        '是',
        '',
        '是',
        '',
        '是',
        '',
        '',
        '',
        '',
        '是',
        '',
        '是',
        '是',
        '',
        '是',
        '',
        '是',
        '',
        '',
        '是',
        '',
        '',
        '是',
        '',
      ],
    ];

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名列宽
    ];
    for (let i = 0; i < 30; i++) {
      wscols.push({ wch: 12 }); // 时间段列宽
    }
    ws['!cols'] = wscols;

    // 添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '志愿者信息');

    // 导出文件
    XLSX.writeFile(wb, '志愿者信息模板.xlsx');
  }

  // 从Excel导入志愿者信息
  function importVolunteersFromExcel(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // 获取第一个工作表
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // 将工作表转换为JSON数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 3 }); // 从第4行开始（跳过说明行）

        if (jsonData.length === 0) {
          alert('未找到志愿者数据，请检查Excel文件格式');
          return;
        }

        // 解析导入的志愿者数据
        const importedVolunteers = [];
        const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五'];

        jsonData.forEach((row, index) => {
          const name = row['志愿者姓名'];
          if (!name) return;

          const availability = [];

          // 遍历每个时间段
          for (let day = 1; day <= 5; day++) {
            for (let period = 1; period <= 6; period++) {
              const key = `${weekdays[day - 1]}-第${period}节`;
              const available =
                row[key] === '是' || row[key] === 'Y' || row[key] === 'y' || row[key] === '√' || row[key] === true;

              if (available) {
                availability.push({ day, period });
              }
            }
          }

          // 只添加有可用时间的志愿者
          if (availability.length > 0) {
            importedVolunteers.push({
              id: Date.now() + index, // 使用时间戳+索引作为唯一ID
              name,
              availability,
            });
          }
        });

        // 添加到现有志愿者列表
        if (importedVolunteers.length > 0) {
          volunteers = [...volunteers, ...importedVolunteers];
          updateVolunteerList();
          alert(`成功导入 ${importedVolunteers.length} 名志愿者信息`);
        } else {
          alert('未找到有效的志愿者数据，请检查Excel文件格式');
        }

        // 清空文件输入框
        volunteerFileInput.value = '';
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败，请检查文件格式是否正确');
      }
    };

    reader.onerror = function () {
      alert('读取文件失败');
    };

    reader.readAsArrayBuffer(file);
  }

  // 导出志愿者信息到Excel
  function exportVolunteersToExcel() {
    if (volunteers.length === 0) {
      alert('没有志愿者信息可导出');
      return;
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 准备表头数据
    const headers = [
      '志愿者姓名',
      '星期一-第1节',
      '星期一-第2节',
      '星期一-第3节',
      '星期一-第4节',
      '星期一-第5节',
      '星期一-第6节',
      '星期二-第1节',
      '星期二-第2节',
      '星期二-第3节',
      '星期二-第4节',
      '星期二-第5节',
      '星期二-第6节',
      '星期三-第1节',
      '星期三-第2节',
      '星期三-第3节',
      '星期三-第4节',
      '星期三-第5节',
      '星期三-第6节',
      '星期四-第1节',
      '星期四-第2节',
      '星期四-第3节',
      '星期四-第4节',
      '星期四-第5节',
      '星期四-第6节',
      '星期五-第1节',
      '星期五-第2节',
      '星期五-第3节',
      '星期五-第4节',
      '星期五-第5节',
      '星期五-第6节',
    ];

    // 添加标题和说明
    const data = [['志愿者排班系统 - 志愿者信息'], [`导出时间：${new Date().toLocaleString()}`], [], headers];

    // 添加志愿者数据
    volunteers.forEach(volunteer => {
      const row = new Array(31).fill(''); // 31列：1列姓名 + 30列时间段
      row[0] = volunteer.name;

      // 填写可用时间
      volunteer.availability.forEach(avail => {
        const day = avail.day;
        const period = avail.period;
        const colIndex = (day - 1) * 6 + period;
        row[colIndex] = '是';
      });

      data.push(row);
    });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名列宽
    ];
    for (let i = 0; i < 30; i++) {
      wscols.push({ wch: 12 }); // 时间段列宽
    }
    ws['!cols'] = wscols;

    // 添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '志愿者信息');

    // 导出文件
    XLSX.writeFile(wb, '志愿者信息.xlsx');
  }

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

// 初始化第二阶段：班次设置
function initPhase2() {
  const phase2Prev = document.getElementById('phase2-prev');
  const phase2Next = document.getElementById('phase2-next');

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

    // 进入第三阶段
    goToPhase(3);
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
      if (requiredCount > 0) {
        allShifts.push({ day, period, requiredCount });
      }
    }
  }

  // 按需求人数降序排序班次
  allShifts.sort((a, b) => b.requiredCount - a.requiredCount);

  // 第二步：按需求优先级分配志愿者
  allShifts.forEach(shift => {
    const { day, period, requiredCount } = shift;

    // 找出可在此班次值班的志愿者
    let availableVolunteers = volunteers.filter(volunteer =>
      volunteer.availability.some(avail => avail.day === day && avail.period === period),
    );

    // 按已分配班次数升序排序，优先分配给班次少的志愿者
    availableVolunteers.sort((a, b) => assignedCounts[a.id] - assignedCounts[b.id]);

    // 分配班次
    for (let i = 0; i < requiredCount && i < availableVolunteers.length; i++) {
      const volunteer = availableVolunteers[i];
      schedule[day][period].push({
        id: volunteer.id,
        name: volunteer.name,
      });
      assignedCounts[volunteer.id]++;
    }
  });

  // 检查是否有班次未满足人数需求
  let unmatchedShifts = [];
  for (let day = 1; day <= 5; day++) {
    for (let period = 1; period <= 6; period++) {
      const requiredCount = (shiftRequirements[day] && shiftRequirements[day][period]) || 0;
      const assignedCount = schedule[day][period].length;

      if (requiredCount > assignedCount) {
        unmatchedShifts.push({
          day,
          period,
          required: requiredCount,
          assigned: assignedCount,
        });
      }
    }
  }

  // 如果有未满足的班次，给出警告但继续返回结果
  if (unmatchedShifts.length > 0) {
    console.warn('Some shifts could not be fully staffed:', unmatchedShifts);
  }

  return schedule;
}

// 生成预览表格
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

// 添加志愿者标签
function addVolunteerChip(container, volunteer, day, period) {
  const chip = document.createElement('div');
  chip.className = 'volunteer-chip';
  chip.dataset.volunteerId = volunteer.id;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = volunteer.name;

  const removeButton = document.createElement('span');
  removeButton.className = 'remove-volunteer';
  removeButton.innerHTML = '&times;';
  removeButton.addEventListener('click', function (e) {
    e.stopPropagation(); // 阻止事件冒泡
    removeVolunteerFromSchedule(volunteer.id, day, period);
    chip.remove();
  });

  chip.appendChild(nameSpan);
  chip.appendChild(removeButton);
  container.appendChild(chip);
}

// 从排班表中移除志愿者
function removeVolunteerFromSchedule(volunteerId, day, period) {
  if (scheduleData[day] && scheduleData[day][period]) {
    scheduleData[day][period] = scheduleData[day][period].filter(v => v.id !== volunteerId);
  }
}

// 编辑单元格
function editCell(cell) {
  // 如果单元格已经处于编辑模式，则不执行操作
  if (cell.classList.contains('edit-mode')) return;

  const day = parseInt(cell.dataset.day);
  const period = parseInt(cell.dataset.period);

  // 添加编辑模式样式
  cell.classList.add('edit-mode');

  // 创建可用志愿者下拉列表
  const select = document.createElement('select');
  select.className = 'form-select mt-2';

  // 添加空选项
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- 选择志愿者 --';
  select.appendChild(emptyOption);

  // 找出可在此班次值班且尚未被分配的志愿者
  const assignedVolunteerIds = scheduleData[day][period].map(v => v.id);
  const availableVolunteers = volunteers.filter(volunteer => {
    // 志愿者在此时间段可用
    const isAvailable = volunteer.availability.some(avail => avail.day === day && avail.period === period);
    // 志愿者尚未被分配到此班次
    const notAssigned = !assignedVolunteerIds.includes(volunteer.id);
    return isAvailable && notAssigned;
  });

  // 添加可用志愿者选项
  availableVolunteers.forEach(volunteer => {
    const option = document.createElement('option');
    option.value = volunteer.id;
    option.textContent = volunteer.name;
    select.appendChild(option);
  });

  // 添加按钮组
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'btn-group mt-2';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm btn-success';
  addBtn.textContent = '添加';
  addBtn.addEventListener('click', function () {
    const volunteerId = select.value;
    if (volunteerId) {
      const volunteer = volunteers.find(v => v.id == volunteerId);

      // 添加到排班数据
      scheduleData[day][period].push({
        id: volunteer.id,
        name: volunteer.name,
      });

      // 添加志愿者标签
      const cellContent = cell.querySelector('.cell-content');
      addVolunteerChip(cellContent, volunteer, day, period);

      // 重置选择框
      select.value = '';
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-sm btn-secondary ms-1';
  cancelBtn.textContent = '完成';
  cancelBtn.addEventListener('click', function () {
    // 移除编辑界面
    select.remove();
    buttonGroup.remove();
    // 移除编辑模式样式
    cell.classList.remove('edit-mode');
  });

  buttonGroup.appendChild(addBtn);
  buttonGroup.appendChild(cancelBtn);

  // 添加到单元格
  cell.appendChild(select);
  cell.appendChild(buttonGroup);
}

// 导出为Excel
function exportToExcel() {
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  wb.SheetNames.push('志愿者排班表');

  // 准备数据
  const data = [['时间段', '星期一', '星期二', '星期三', '星期四', '星期五']];

  // 添加数据行
  for (let period = 1; period <= 6; period++) {
    const row = [`第${period}节`];

    for (let day = 1; day <= 5; day++) {
      if (shiftRequirements[day] && shiftRequirements[day][period] && shiftRequirements[day][period] > 0) {
        const volunteers = scheduleData[day] && scheduleData[day][period] ? scheduleData[day][period] : [];
        row.push(volunteers.map(v => v.name).join('\n'));
      } else {
        row.push('');
      }
    }

    data.push(row);
  }

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 调整列宽
  const wscols = [
    { wch: 10 }, // 时间段列宽
    { wch: 20 }, // 星期一列宽
    { wch: 20 }, // 星期二列宽
    { wch: 20 }, // 星期三列宽
    { wch: 20 }, // 星期四列宽
    { wch: 20 }, // 星期五列宽
  ];
  ws['!cols'] = wscols;

  // 添加到工作簿
  wb.Sheets['志愿者排班表'] = ws;

  // 导出文件
  XLSX.writeFile(wb, '志愿者排班表.xlsx');
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
    localStorage.removeItem('volunteer-schedule');
  }
}
