// upload.js - 安全版本，不包含硬编码Token

class ImageUploader {
    constructor() {
        this.token = ''; // 从环境变量获取
        this.repo = 'QQzhusha123456/my-images';
    }

    async upload(file) {
        try {
            // 1. 压缩图片
            const compressed = await this.compressImage(file);
            
            // 2. 上传到GitHub
            const cdnUrl = await this.uploadToGitHub(compressed);
            
            return {
                success: true,
                originalName: file.name,
                cdnUrl: cdnUrl,
                markdown: `![${file.name}](${cdnUrl})`,
                html: `<img src="${cdnUrl}" alt="${file.name}" width="500">`
            };
        } catch (error) {
            return {
                success: false,
                originalName: file.name,
                error: error.message
            };
        }
    }

    async compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 限制最大宽度为1200px
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 1200;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async uploadToGitHub(file) {
        // Token应该从环境变量获取
        if (!this.token) {
            this.token = window.GITHUB_TOKEN || '';
        }
        
        if (!this.token) {
            throw new Error('请配置GITHUB_TOKEN环境变量');
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${timestamp}-${randomStr}.${extension}`;

        // 转换为base64
        const base64 = await this.fileToBase64(file);

        // 上传到GitHub
        const response = await fetch(`https://api.github.com/repos/${this.repo}/contents/${filename}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload ${filename}`,
                content: base64,
                branch: 'main'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '上传失败');
        }

        // 生成CDN链接
        return `https://cdn.jsdelivr.net/gh/${this.repo}/${filename}`;
    }

    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // 移除data:image/jpeg;base64,前缀
                const base64 = e.target.result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(file);
        });
    }

    // 设置Token（从环境变量注入）
    setToken(token) {
        this.token = token;
    }
}

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploader;
} else {
    window.ImageUploader = ImageUploader;
              }
