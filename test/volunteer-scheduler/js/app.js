// 全局变量
let volunteers = []; // 志愿者列表
let shiftRequirements = {}; // 每个班次需要的志愿者人数
let scheduleData = {}; // 排班结果数据
let shiftClassRequirements = {}; // 每个班级需要的志愿者人数
let maxShiftsPerVolunteer = 0; // 每个志愿者最大排班次数限制

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

  // 更新志愿者列表显示
  function updateVolunteerList() {
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

  // 下载志愿者信息模板
  function downloadVolunteerTemplate() {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 准备表头数据
    const headers = [
      '志愿者姓名',
      '志愿者班级',
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
      ["请在下方填写志愿者姓名、班级和可用时间（在对应时间段填入'是'表示可用，留空表示不可用）"],
      ['请务必填写班级信息，每个志愿者必须有对应的班级'],
      ['—————————————————————————————————————————————————————————————————————————'],
      headers,
      [
        '张三', // 姓名
        '药剂3班', // 班级
        '是', // 星期一-第1节
        '', // 星期一-第2节
        '是', // 星期一-第3节
        '', // 星期一-第4节
        '是', // 星期一-第5节
        '', // 星期一-第6节
        '', // 星期二-第1节
        '是', // 星期二-第2节
        '', // 星期二-第3节
        '', // 星期二-第4节
        '是', // 星期二-第5节
        '', // 星期二-第6节
        '是', // 星期三-第1节
        '', // 星期三-第2节
        '是', // 星期三-第3节
        '', // 星期三-第4节
        '是', // 星期三-第5节
        '', // 星期三-第6节
        '', // 星期四-第1节
        '', // 星期四-第2节
        '是', // 星期四-第3节
        '', // 星期四-第4节
        '是', // 星期四-第5节
        '', // 星期四-第6节
        '是', // 星期五-第1节
        '', // 星期五-第2节
        '是', // 星期五-第3节
        '是', // 星期五-第4节
        '', // 星期五-第5节
        '', // 星期五-第6节
      ],
      [
        '李四', // 姓名
        '药剂4班', // 班级
        '', // 星期一-第1节
        '是', // 星期一-第2节
        '', // 星期一-第3节
        '是', // 星期一-第4节
        '', // 星期一-第5节
        '是', // 星期一-第6节
        '是', // 星期二-第1节
        '', // 星期二-第2节
        '是', // 星期二-第3节
        '', // 星期二-第4节
        '是', // 星期二-第5节
        '', // 星期二-第6节
        '', // 星期三-第1节
        '', // 星期三-第2节
        '', // 星期三-第3节
        '是', // 星期三-第4节
        '', // 星期三-第5节
        '是', // 星期三-第6节
        '是', // 星期四-第1节
        '', // 星期四-第2节
        '是', // 星期四-第3节
        '', // 星期四-第4节
        '是', // 星期四-第5节
        '', // 星期四-第6节
        '', // 星期五-第1节
        '是', // 星期五-第2节
        '', // 星期五-第3节
        '', // 星期五-第4节
        '是', // 星期五-第5节
        '', // 星期五-第6节
      ],
      [
        '', // 空行，用于用户填写
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
    ];

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名列宽
      { wch: 15 }, // 班级列宽
    ];
    for (let i = 0; i < 30; i++) {
      wscols.push({ wch: 12 }); // 时间段列宽
    }
    ws['!cols'] = wscols;

    // 添加样式和格式 - 使表头突出显示
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFFF00' } } };
    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRow = 4; // 第5行是表头
    for (let C = range.s.c; C <= range.e.c; C++) {
      const headerCell = XLSX.utils.encode_cell({ r: headerRow, c: C });
      if (!ws[headerCell]) continue;
      if (!ws[headerCell].s) ws[headerCell].s = {};
      ws[headerCell].s = headerStyle;
    }

    // 添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '志愿者信息');

    // 导出文件
    XLSX.writeFile(wb, '志愿者信息模板.xlsx');

    console.log('Excel模板已导出，包含字段：', headers);
    alert(
      '志愿者信息模板已下载，请按照以下要求填写：\n\n1. 必须填写志愿者姓名和班级\n2. 在志愿者可用的时间段填入"是"\n3. 不要修改表头行和格式\n4. 填写完成后保存并导入',
    );
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

        // 尝试检测表头位置
        let headerRowIndex = -1;
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // 遍历前10行寻找表头
        for (let i = range.s.r; i <= Math.min(range.s.r + 10, range.e.r); i++) {
          const cellA = worksheet[XLSX.utils.encode_cell({ r: i, c: 0 })];
          const cellB = worksheet[XLSX.utils.encode_cell({ r: i, c: 1 })];

          // 检查是否包含"志愿者姓名"或"志愿者班级"
          if (
            cellA &&
            cellB &&
            ((cellA.w && cellA.w.includes('志愿者姓名')) || (cellB.w && cellB.w.includes('志愿者班级')))
          ) {
            headerRowIndex = i;
            console.log('找到表头行，位置：', headerRowIndex + 1);
            break;
          }
        }

        if (headerRowIndex === -1) {
          console.log('未检测到标准表头，尝试使用默认位置（第4行）');
          headerRowIndex = 3; // 默认为第4行（索引为3）
        }

        // 将工作表转换为JSON数据，从表头的下一行开始
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          header: ['志愿者姓名', '志愿者班级'].concat(
            Array.from({ length: 30 }, (_, i) => {
              const day = Math.floor(i / 6) + 1;
              const period = (i % 6) + 1;
              return `星期${['一', '二', '三', '四', '五'][day - 1]}-第${period}节`;
            }),
          ),
        });

        console.log('解析到的数据：', jsonData.slice(0, 2)); // 显示前两行数据用于调试

        if (jsonData.length <= 1) {
          // 如果只有表头行或没有数据
          alert('未找到志愿者数据，请检查Excel文件格式');
          return;
        }

        // 跳过表头行
        const dataRows = jsonData.slice(1);

        // 解析导入的志愿者数据
        const importedVolunteers = [];
        const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五'];

        dataRows.forEach((row, index) => {
          // 尝试多种可能的名称格式
          const name = row['志愿者姓名'] || row['姓名'] || row[0];
          const className = row['志愿者班级'] || row['班级'] || row[1];

          if (!name || name === '志愿者姓名') return; // 跳过空行或重复的表头
          if (!className) {
            console.warn(`警告：志愿者 "${name}" 没有班级信息`);
            return; // 跳过没有班级信息的志愿者
          }

          const availability = [];

          // 遍历每个时间段
          for (let day = 1; day <= 5; day++) {
            for (let period = 1; period <= 6; period++) {
              const key = `${weekdays[day - 1]}-第${period}节`;
              // 获取单元格值，如果单元格不存在，尝试使用序号获取
              const cellValue = row[key] || row[(day - 1) * 6 + period + 1];

              // 检查多种可能的"是"的表示方式
              const available =
                cellValue === '是' ||
                cellValue === 'Y' ||
                cellValue === 'y' ||
                cellValue === '√' ||
                cellValue === true ||
                cellValue === 1 ||
                cellValue === '1' ||
                (typeof cellValue === 'string' && cellValue.toLowerCase() === 'yes');

              if (available) {
                availability.push({ day, period });
              }
            }
          }

          // 只添加有效的志愿者（有姓名、班级和至少一个可用时间段）
          if (name && className && availability.length > 0) {
            importedVolunteers.push({
              id: Date.now() + index, // 使用时间戳+索引作为唯一ID
              name,
              class: className,
              availability,
            });
          } else if (name && className) {
            console.warn(`警告：志愿者 "${name}" 没有任何可用时间段`);
          }
        });

        // 添加到现有志愿者列表
        if (importedVolunteers.length > 0) {
          volunteers = [...volunteers, ...importedVolunteers];
          updateVolunteerList();

          // 显示更详细的成功信息，包含班级信息
          const classCount = new Set(importedVolunteers.map(v => v.class)).size;
          alert(`成功导入 ${importedVolunteers.length} 名志愿者信息，包含 ${classCount} 个不同班级`);
          console.log('导入的志愿者：', importedVolunteers);
        } else {
          alert(
            '未找到有效的志愿者数据，请检查Excel文件格式是否正确。\n\n确保表格包含志愿者姓名、班级和至少一个标记为"是"的可用时间段。',
          );
        }

        // 清空文件输入框
        volunteerFileInput.value = '';
      } catch (error) {
        console.error('导入失败:', error);
        alert(`导入失败: ${error.message}\n\n请检查文件格式是否正确，确保使用下载的模板填写数据。`);
      }
    };

    reader.onerror = function (error) {
      console.error('读取文件错误:', error);
      alert('读取文件失败，请检查文件是否有效');
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
      '志愿者班级',
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

    // 准备数据行
    const data = [['志愿者排班系统 - 志愿者信息'], [`导出时间：${new Date().toLocaleString()}`], [], headers];

    volunteers.forEach(volunteer => {
      const row = Array(headers.length).fill('');
      row[0] = volunteer.name;
      row[1] = volunteer.class;

      // 填充可用时间
      volunteer.availability.forEach(avail => {
        const day = avail.day;
        const period = avail.period;
        const colIndex = (day - 1) * 6 + period + 1; // +1是因为前两列是姓名和班级
        row[colIndex] = '是';
      });

      data.push(row);
    });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名列宽
      { wch: 15 }, // 班级列宽
    ];
    for (let i = 0; i < 30; i++) {
      wscols.push({ wch: 12 }); // 时间段列宽
    }
    ws['!cols'] = wscols;

    // 添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '志愿者信息');

    // 导出文件
    XLSX.writeFile(wb, '志愿者信息.xlsx');
    console.log('已导出志愿者信息，包含班级字段');
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
