import socket
import urllib.parse

from utils import log
# 需要加前缀 import utils
# 错的
# import utils.log
# utils.log()

from routes import route_static, route_js, route_css
from routes import route_dict
import _thread


# 定义一个 class 用于保存请求的数据
class Request(object):
    def __init__(self):
        self.raw_data = ''
        self.method = 'GET'
        self.path = ''
        self.query = {}
        self.body = ''

    def form(self):
        body = urllib.parse.unquote_plus(self.body)
        log('form', self.body)
        log('form', body)
        args = body.split('&')
        f = {}
        log('args', args)
        for arg in args:
            k, v = arg.split('=')
            f[k] = v
        log('form() 字典', f)
        return f

    def getHeaders(self):
        header, body = self.raw_data.split('\r\n\r\n', 1)
        h = header.split('\r\n')
        h = h[1:]
        headers = {}
        for i in h:
            key, value = i.split(': ')
            headers[key] = value
        return headers


# 一个修改全局变量的例子


def error(code=404):
    """
    根据 code 返回不同的错误响应
    目前只有 404
    """
    # 之前上课我说过不要用数字来作为字典的 key
    # 但是在 HTTP 协议中 code 都是数字似乎更方便所以打破了这个原则
    e = {
        404: b'HTTP/1.1 404 NOT FOUND\r\n\r\n<h1>NOT FOUND</h1>',
    }
    return e.get(code, b'')


def parsed_path(path):
    """
    输入: /gua?message=hello&author=gua
    返回
    (gua, {
        'message': 'hello',
        'author': 'gua',
    })
    """
    if '?' not in path:
        return path, {}
    else:
        path, query_string = path.split('?', 1)
        args = query_string.split('&')
        query = {}
        for arg in args:
            k, v = arg.split('=')
            query[k] = v
        return path, query


def template(name):
    """
    静态资源的处理函数, 读取图片并生成响应返回
    """
    filename = name
    path = '{}'.format(filename)
    path = 'audio-video-player/audio_video_player.html'
    with open(path, 'rb') as f:
        header = b'HTTP/1.1 200 OK\r\n'
        r = header + b'\r\n' + f.read()
        # button btn
        # response rsp
        return r


def response_for_request(request):
    request.path, request.query = parsed_path(request.path)
    log('path 和 query', request.path, request.query)
    """
    根据 path 调用相应的处理函数
    没有处理的 path 会返回 404
    """
    # r = {
    #     # '/static': route_static,
    #     '/js': route_js,
    #     # '/css': route_css,
    #     # '/': route_index,
    #     # '/login': route_login,
    #     # '/messages': route_message,
    # }
    # r.update(route_dict())
    log(454545, request.path)
    # response = r.get(request.path, error)
    return template(request.path)


def process_request(connection):
    r = connection.recv(1024)
    r = r.decode()
    log('request, {}\n'.format(r))
    # 因为 chrome 会发送空请求导致 split 得到空 list
    # 所以这里判断一下防止程序崩溃
    if len(r) > 0:
        request = Request()
        request.raw_data = r
        # 只能 split 一次，因为 body 中可能有换行
        # 把 body 放入 request 中
        header, request.body = r.split('\r\n\r\n', 1)
        h = header.split('\r\n')
        parts = h[0].split()
        request.path = parts[1]
        # 设置 request 的 method
        request.method = parts[0]
        # 用 response_for_path 函数来得到 path 对应的响应内容
        response = response_for_request(request)
        # 把响应发送给客户端
        connection.sendall(response)
    else:
        log('接收到了一个空请求')

    # 处理完请求, 关闭连接
    connection.close()


def run(host='', port=3000):
    """
    启动服务器
    """
    # 初始化 socket 套路
    # 使用 with 可以保证程序中断的时候正确关闭 socket 释放占用的端口
    log('开始运行于', '{}:{}'.format(host, port))
    with socket.socket() as s:
        s.bind((host, port))
        # 无限循环来处理请求
        # 监听 接受 读取请求数据 解码成字符串
        s.listen()
        while True:
            connection, address = s.accept()
            log('ip <{}>\n'.format(address))
            _thread.start_new_thread(process_request, (connection,))


if __name__ == '__main__':
    # 生成配置并且运行程序
    config = dict(
        host='127.0.0.1',
        port=3000,
    )
    run(**config)
