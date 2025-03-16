// 简单的PWA图标生成脚本
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 如果没有安装canvas包，你需要安装：
// npm install canvas

// 图标尺寸
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 图标目录
const iconDir = path.join(__dirname, 'icons');

// 确保图标目录存在
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
  console.log(`创建目录: ${iconDir}`);
}

// 为每个尺寸生成图标
sizes.forEach(size => {
  console.log(`正在生成 ${size}x${size} 图标...`);

  // 创建Canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 绘制背景
  ctx.fillStyle = '#0d6efd';
  ctx.fillRect(0, 0, size, size);

  // 添加文字
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size / 3}px Arial`;
  ctx.fillText('排班', size / 2, size / 2);

  // 保存图片
  const iconPath = path.join(iconDir, `icon-${size}x${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(iconPath, buffer);

  console.log(`图标已保存: ${iconPath}`);
});

console.log('所有PWA图标已生成完成!');

// 如果你没有Node.js环境，请使用之前创建的generate-icons.html在浏览器中生成图标
