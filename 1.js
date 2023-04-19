// void Page_Load(object
// sender, EventArgs;
// e;
// )
//
// {
//
//     if (Request.QueryString["op"] == "read")
//     {
//
//         Response.ContentType = "video/mp4";
//
//         Response.BinaryWrite(File.ReadAllBytes(Server.MapPath("2.mp4")));
//
//         Response.End();
//
//     }
//
// }

function loadVideo() {

    var xhr = new XMLHttpRequest();

    xhr.open('post', '?op=read');

    xhr.responseType = 'blob';//注意，要设置这个请求头，自己看下面列出的XMLHttpRequest Level 2内容介绍

    xhr.onreadystatechange = function() {

        if (4 == xhr.readyState)
        {

            if (200 == xhr.status)
            {

                var blob = new Blob([xhr.response], {type: 'video/mp4'});

                v.src = URL.createObjectURL(blob);

            }

            else
            {
                alert(xhr.status + '\n' + xhr.responseText);
            }

        }

    }

    xhr.send(null);

}
