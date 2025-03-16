// PWA安装功能
let deferredPrompt;
const installButton = document.getElementById('install-pwa');
const pwaAlert = document.querySelector('.alert');

// 初始状态下隐藏安装按钮
if (installButton) {
  installButton.style.display = 'none';
}

// 监听beforeinstallprompt事件
window.addEventListener('beforeinstallprompt', e => {
  // 阻止Chrome 67及更早版本自动显示安装提示
  e.preventDefault();
  // 保存事件以便稍后触发
  deferredPrompt = e;
  // 显示安装按钮
  if (installButton) {
    installButton.style.display = 'block';
    pwaAlert.style.display = 'block';
  }

  // 输出调试信息
  console.log('可以安装PWA了! 显示安装按钮');
});

// 添加按钮点击事件
if (installButton) {
  installButton.addEventListener('click', async () => {
    // 检查是否有安装提示事件
    if (!deferredPrompt) {
      // 如果没有事件，显示手动安装指南
      showManualInstallGuide();
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();
    // 等待用户响应提示
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`用户安装操作结果: ${outcome}`);
    // 事件只能使用一次
    deferredPrompt = null;
    // 隐藏按钮
    installButton.style.display = 'none';
    pwaAlert.style.display = 'none';
  });
}

// 监听已安装事件
window.addEventListener('appinstalled', event => {
  console.log('PWA已成功安装');
  // 隐藏安装界面元素
  if (installButton) {
    installButton.style.display = 'none';
    pwaAlert.style.display = 'none';
  }
  // 清除保存的提示
  deferredPrompt = null;
});

// 显示不同浏览器的手动安装指南
function showManualInstallGuide() {
  // 检测浏览器类型
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);

  let guideText = '';

  if (isIOS) {
    guideText = `
      <h5>在iOS Safari上安装:</h5>
      <ol>
        <li>点击底部的分享按钮 <span style="font-size:1.5em">⎙</span></li>
        <li>向下滚动并点击"添加到主屏幕"</li>
        <li>点击"添加"确认</li>
      </ol>
    `;
  } else if (isSafari) {
    guideText = `
      <h5>在Safari上安装:</h5>
      <ol>
        <li>点击地址栏右侧的分享按钮</li>
        <li>选择"添加到主屏幕"</li>
        <li>点击"添加"确认</li>
      </ol>
    `;
  } else if (isChrome) {
    guideText = `
      <h5>在Chrome上安装:</h5>
      <ol>
        <li>点击地址栏右侧的菜单按钮 (⋮)</li>
        <li>选择"安装应用"选项</li>
        <li>在弹出的对话框中点击"安装"</li>
      </ol>
    `;
  } else if (isEdge) {
    guideText = `
      <h5>在Edge上安装:</h5>
      <ol>
        <li>点击地址栏右侧的菜单按钮 (...)</li>
        <li>选择"应用"，然后点击"将此站点安装为应用"</li>
        <li>在弹出的对话框中点击"安装"</li>
      </ol>
    `;
  } else if (isFirefox) {
    guideText = `
      <h5>在Firefox上安装:</h5>
      <ol>
        <li>Firefox移动版支持PWA安装。点击地址栏右侧的菜单按钮</li>
        <li>选择"安装"或"添加到主屏幕"选项</li>
      </ol>
    `;
  } else {
    guideText = `
      <h5>安装步骤:</h5>
      <ol>
        <li>打开浏览器的菜单</li>
        <li>查找"安装应用"或"添加到主屏幕"选项</li>
        <li>按照浏览器提示完成安装</li>
      </ol>
    `;
  }

  // 创建并显示模态框
  const modalHtml = `
    <div class="modal fade" id="pwaInstallGuideModal" tabindex="-1" aria-labelledby="pwaInstallGuideModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="pwaInstallGuideModalLabel">安装到您的设备</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${guideText}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加到页面
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);

  // 显示模态框
  const modal = new bootstrap.Modal(document.getElementById('pwaInstallGuideModal'));
  modal.show();
}

// 在页面加载完成后检查PWA状态
document.addEventListener('DOMContentLoaded', () => {
  // 检测是否已经作为PWA运行
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('正在以PWA模式运行');
    // 已经是PWA模式，隐藏安装提示
    if (pwaAlert) {
      pwaAlert.style.display = 'none';
    }
  } else {
    console.log('在浏览器中运行，可以提示安装');
    // 定义一个函数，检查是否满足PWA安装条件
    function checkPWAInstallability() {
      if ('serviceWorker' in navigator) {
        // 检查Service Worker是否注册
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            console.log('Service Worker已注册');
            // 如果没有安装提示事件，但希望用户能够手动安装
            if (!deferredPrompt && pwaAlert) {
              pwaAlert.style.display = 'block';
              installButton.style.display = 'block';
            }
          } else {
            console.log('Service Worker未注册');
          }
        });
      }
    }

    // 页面加载后延迟检查
    setTimeout(checkPWAInstallability, 2000);
  }
});
