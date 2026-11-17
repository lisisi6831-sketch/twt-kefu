export default async function handler(req, res) {
  const targetOrigin = 'https://visitor-chat.com';
  const defaultPath = '/direct/1f256c5a96dd5bb935c998e303c4c857_nh5a4pjqq3tz';

  // 访问根路径时自动指向你的专属聊天室，其他路径（JS/CSS/发消息接口）原样转发
  const reqUrl = req.url === '/' || req.url === '' ? defaultPath : req.url;
  const targetUrl = `${targetOrigin}${reqUrl}`;

  try {
    const headers = { ...req.headers };
    headers.host = '://visitor-chat.com';
    headers.origin = targetOrigin;
    headers.referer = `${targetOrigin}${defaultPath}`;
    delete headers['accept-encoding']; // 防止双重压缩导致乱码

    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: 'follow',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 转发响应头，并移除防嵌套拦截头
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'x-frame-options' && lowerKey !== 'content-security-policy') {
        res.setHeader(key, value);
      }
    });

    // 替换网页源码中可能写死的源站绝对路径，确保所有资源都走你的高速域名
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('javascript')) {
      let text = await response.text();
      text = text.replace(/https:\/\/page1\.visitor-chat\.com/g, '');
      res.status(response.status).send(text);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      res.status(response.status).send(Buffer.from(arrayBuffer));
    }
  } catch (error) {
    res.status(502).send('客服通道连接异常，请刷新重试: ' + error.message);
  }
}
