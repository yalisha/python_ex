/**
 * 综合管理系统 - PWA安装脚本
 * 用于将Web应用安装到用户设备上
 */

// PWA安装相关变量
let deferredPrompt;
const installButton = document.getElementById('install-button');

// 如果安装按钮不存在，则不显示
if (installButton) {
  // 默认隐藏安装按钮
  installButton.style.display = 'none';
}

// 监听beforeinstallprompt事件，该事件在PWA可以安装时触发
window.addEventListener('beforeinstallprompt', e => {
  // 阻止Chrome 76及以前版本自动显示安装提示
  e.preventDefault();

  // 保存事件以便稍后触发
  deferredPrompt = e;

  // 显示安装按钮
  if (installButton) {
    installButton.style.display = 'block';

    // 点击安装按钮时触发安装
    installButton.addEventListener('click', installPWA);
  }

  // 记录可以安装的状态
  console.log('PWA可以安装');
});

// 安装PWA的函数
function installPWA() {
  // 如果没有安装事件，直接返回
  if (!deferredPrompt) {
    return;
  }

  // 显示安装提示
  deferredPrompt.prompt();

  // 等待用户响应
  deferredPrompt.userChoice.then(choiceResult => {
    if (choiceResult.outcome === 'accepted') {
      console.log('用户接受了安装');

      // 隐藏安装按钮
      if (installButton) {
        installButton.style.display = 'none';
      }

      // 如果存在安装弹窗，也隐藏它
      const installAlert = document.querySelector('.alert');
      if (installAlert) {
        installAlert.style.display = 'none';
      }
    } else {
      console.log('用户拒绝了安装');
    }

    // 清空事件，因为它只能使用一次
    deferredPrompt = null;
  });
}

// 监听应用安装后的事件
window.addEventListener('appinstalled', evt => {
  console.log('应用已安装');

  // 隐藏安装按钮
  if (installButton) {
    installButton.style.display = 'none';
  }

  // 如果存在安装弹窗，也隐藏它
  const installAlert = document.querySelector('.alert');
  if (installAlert) {
    installAlert.style.display = 'none';
  }
});

// 检测是否在已安装的PWA中运行
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  console.log('在已安装的PWA中运行');

  // 隐藏安装提示
  const installAlert = document.querySelector('.alert');
  if (installAlert) {
    installAlert.style.display = 'none';
  }
}

// 如果是iOS设备显示特殊安装说明
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
  const installAlert = document.querySelector('.alert');
  if (installAlert) {
    installAlert.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="me-3">
          <strong><i class="bi bi-apple"></i> iOS设备安装说明</strong>
          <p class="mb-0">请点击分享按钮，然后选择"添加到主屏幕"来安装此应用</p>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }
}
