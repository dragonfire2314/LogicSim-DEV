rmdir /s ..\newBackEnd\public\public
xcopy /E .\public ..\newBackEnd\public\public
xcopy ..\newBackEnd\public\public\index.html ..\newBackEnd\public\public\index2.html
del ..\newBackEnd\public\public\index.html