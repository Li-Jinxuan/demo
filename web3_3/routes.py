from utils import log
from models import Message
from models import User

message_list = []


def template(name):
    """
    根据名字读取 templates 文件夹里的一个文件并返回
    """
    path = name
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def route_index(request):
    """
    主页的处理函数, 返回主页的响应
    """
    header = 'HTTP/1.1 210 VERY OK\r\nContent-Type: text/html\r\n'
    body = template('index.html')
    r = header + '\r\n' + body
    return r.encode()


def route_login(request):
    if request.method == 'POST':
        form = request.form()
        log('form111111111111111', form)
        u = User.new(form)
        if u.validate_login():
            result = '登录成功'
        else:
            result = '用户名或者密码错误'
    else:
        result = ''
    body = template('login.html')
    body = body.replace('{{result}}', result)
    header = 'HTTP/1.1 210 VERY OK\r\nContent-Type: text/html\r\n'
    r = header + '\r\n' + body
    return r.encode()


def route_register(request):
    if request.method == 'POST':
        form = request.form()
        u = User.new(form)
        if u.validate_register():
            u.save()
            result = '注册成功<br> <pre>{}</pre>'.format(User.all())
        else:
            result = '用户名或者密码长度必须大于2'
    else:
        result = ''
    body = template('register.html')
    body = body.replace('{{result}}', result)
    header = 'HTTP/1.1 210 VERY OK\r\nContent-Type: text/html\r\n'
    r = header + '\r\n' + body
    return r.encode()


def route_message(request):
    """
    主页的处理函数, 返回主页的响应
    """
    log('本次请求的 method', request.method)
    if request.method == 'POST':
        data = request.form()
    else:
        data = request.query

    if len(data.get('message', '')) > 0:
        log('post', data)
        # 应该在这里保存 message_list
        # m = Message.new(data)
        # m.save()
        message_list.append(data)

    header = 'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n'
    body = template('html_basic.html')
    ms = '<br>'.join([str(m) for m in message_list])
    # messages = []
    # for m in message_list:
    #     messages.append(str(m))
    # ms = '<br>'.join(messages)
    body = body.replace('{{messages}}', ms)
    r = header + '\r\n' + body
    return r.encode()


def route_static(request):
    """
    静态资源的处理函数, 读取图片并生成响应返回
    """
    filename = request.query.get('file', 'doge.gif')
    path = 'static/{}'.format(filename)
    with open(path, 'rb') as f:
        header = b'HTTP/1.1 200 OK\r\n'
        r = header + b'\r\n' + f.read()
        # button btn
        # response rsp
        return r


def route_js(request):
    """
    静态资源的处理函数, 读取图片并生成响应返回
    """
    filename = request.query.get('file', 'doge.gif')
    path = 'js/{}'.format(filename)
    with open(path, 'rb') as f:
        header = b'HTTP/1.1 200 OK\r\n'
        r = header + b'\r\n' + f.read()
        # button btn
        # response rsp
        return r


def route_css(request):
    """
    静态资源的处理函数, 读取图片并生成响应返回
    """
    filename = request.query.get('file', 'doge.gif')
    path = 'css/{}'.format(filename)
    with open(path, 'rb') as f:
        header = b'HTTP/1.1 200 OK\r\n'
        r = header + b'\r\n' + f.read()
        # button btn
        # response rsp
        return r


def route_dict():
    # 路由字典
    # key 是路由(路由就是 path)
    # value 是路由处理函数(就是响应)
    r = {

        '/': route_index,
        '/login': route_login,
        '/register': route_register,
        '/messages': route_message,
    }

    return r
