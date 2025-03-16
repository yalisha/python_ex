/**
 * 综合管理系统 - 主JavaScript文件
 *
 * 此文件包含系统首页的功能
 * 主要功能：
 * 1. 系统选择动画效果
 * 2. 记录用户访问历史
 * 3. 检查系统更新
 */

document.addEventListener('DOMContentLoaded', function () {
  console.log('综合管理系统初始化完成');

  // 系统卡片动画效果
  const systemCards = document.querySelectorAll('.system-card');
  systemCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.classList.add('hovered');
    });

    card.addEventListener('mouseleave', function () {
      this.classList.remove('hovered');
    });
  });

  // 记录访问历史
  logSystemAccess('main');

  // 为系统入口添加点击事件记录
  const systemLinks = document.querySelectorAll('.system-card a.btn');
  systemLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const systemName = this.closest('.card').querySelector('.card-title').textContent;
      logSystemAccess(systemName);
    });
  });
});

/**
 * 记录系统访问历史
 * @param {string} systemName - 被访问的系统名称
 */
function logSystemAccess(systemName) {
  const accessLog = JSON.parse(localStorage.getItem('systemAccessLog')) || [];

  accessLog.push({
    system: systemName,
    timestamp: new Date().toISOString(),
  });

  // 只保留最近50条记录
  if (accessLog.length > 50) {
    accessLog.shift();
  }

  localStorage.setItem('systemAccessLog', JSON.stringify(accessLog));
  console.log(`访问记录已保存: ${systemName}`);
}

/**
 * 系统扩展函数
 * 用于未来添加新系统时使用
 * @param {string} systemName - 系统名称
 * @param {string} systemIcon - 系统图标类名
 * @param {string} systemDescription - 系统描述
 * @param {string} systemUrl - 系统URL
 */
function addNewSystem(systemName, systemIcon, systemDescription, systemUrl) {
  // 此函数预留给未来扩展使用
  console.log(`新系统添加功能预留: ${systemName}`);

  // 未来实现代码将在此处添加
  // 1. 创建新系统卡片
  // 2. 添加到首页
  // 3. 更新导航
}

// 预留给未来服务器端集成
// function checkSystemUpdates() {
//     fetch('/api/system-updates')
//         .then(response => response.json())
//         .then(data => {
//             if (data.hasUpdates) {
//                 showUpdateNotification(data.updates);
//             }
//         })
//         .catch(error => console.error('检查更新失败:', error));
// }
