fx_version 'cerulean'
game 'gta5'

author 'Rina Oyun'
description 'Katil Kim - Sosyal Dedüksiyon Oyunu Telefon Uygulaması'
version '1.0.0'

ui_page 'html/index.html'

shared_scripts {
    'config.lua'
}

client_scripts {
    'client/*.lua'
}

server_scripts {
    'server/*.lua'
}

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/app.js',
    'html/sounds/*.mp3',
    'html/images/*.png'
}
