// ==UserScript==
// @name        Ameblo Lightbox JS
// @namespace        http://tampermonkey.net/
// @version        3.8
// @description        ブログ掲載画像の高精細な暗転拡大表示
// @author        Ameba Blog User
// @match        https://ameblo.jp/*
// @match        https://news.ameba.jp/*
// @match        https://blogger.ameba.jp/*
// @match        https://blogtag.ameba.jp/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameblo.jp
// @noframes
// @grant        none
// @updateURL        https://github.com/personwritep/Ameblo_Lightbox_JS/raw/main/Ameblo_Lightbox_JS.user.js
// @downloadURL        https://github.com/personwritep/Ameblo_Lightbox_JS/raw/main/Ameblo_Lightbox_JS.user.js
// ==/UserScript==


let disp_mode=0; // 拡張ディスプレイモードの判別
let back_color; // Lightbox背景色
let graphic_w; // Graphic拡大の拡大率
let comic_w; // Comic拡大の拡大率
let zmode=0; // 拡大モード選択 Graphic:0 Comic:1
let reverse=0; //「Shift」キー押下の拡大状態
let with_cact; // ブログ画面でのLightboxの起動方法
let e_free=0; // ドラッグコピーの不許可:0・許可:1
let step=0; // 動作の段階
let c_press=false; // Ctrlキー押下フラグ


let html_=document.querySelector('html');


let target=document.querySelector('body');
let monitor=new MutationObserver(catch_photo);
monitor.observe(target, { childList: true, subtree: true });

catch_photo();

function catch_photo(){

    monitor.disconnect();

    box_env0(); // Lightbox 基本のパーツ生成
    box_env1(); // Lightbox 各種コントロール設定

    let page_img=document.querySelectorAll('img');
    for(let k=0; k<page_img.length; k++){
        if(page_img[k].parentNode.tagName=='A'){
            page_img[k].parentNode.style.opacity='1'; } // ホバーの薄化表示を無効化
        let style=window.getComputedStyle(page_img[k]);
        if(style.getPropertyValue('pointer-events')=='none'){
            page_img[k].style.pointerEvents='auto'; }} // クリック防止指定を無効化

    monitor.observe(target, { childList: true, subtree: true });


    let path=location.pathname; // 現在のパス名
    let host=window.location.hostname; // 現在のホスト名（サブドメインを含む）

    if(path.split('/').pop().startsWith('image')){ // ⬜ 画像一覧・個別画像
        let page_img=document.querySelectorAll('img');
        for(let k=0; k<page_img.length; k++){
            page_img[k].addEventListener('mousedown', function(event){
                event.stopImmediatePropagation();
                light_box(event, 1, page_img[k]); }); }}
    else{
        if(host=='ameblo.jp'){ // ⬜ ブログ・アメンバー記事
            let page_img;
            if(with_cact==0){
                page_img=document.querySelectorAll('img'); }
            else{
                page_img=document.querySelectorAll('#entryBody img'); }
            for(let k=0; k<page_img.length; k++){
                page_img[k].addEventListener('mousedown', function(event){
                    event.stopImmediatePropagation();
                    light_box(event, 0, page_img[k]); }); }}

        else if(host=='news.ameba.jp' || host=='blogger.ameba.jp' ||
                host=='blogtag.ameba.jp'){ // ⬜ ニュース・ブログランキング・ハッシュタグ
            let page_img=document.querySelectorAll('img');
            for(let k=0; k<page_img.length; k++){
                page_img[k].addEventListener('mousedown', function(event){
                    event.stopImmediatePropagation();
                    light_box(event, 2, page_img[k]); }); }}}



    function light_box(event, type, img){
        if(e_free==0){ // 不許可
            event.preventDefault(); // 画像ドラッグも不可にする

            if(type==0){ // ブログページ用
                if((event.ctrlKey==true && with_cact==0) ||
                   (event.shiftKey==false && event.ctrlKey==false && with_cact==1)){
                    step=1;
                    box_env2(img, 1);
                    ac_disp(1);
                    set_img(img);
                    ex_mag(); }}

            if(type==1){ // 画像一覧画面用
                if(event.ctrlKey==true){
                    step=1;
                    box_env2(img, 0);
                    ac_disp(0);
                    set_img(img);
                    ex_mag(); }}

            if(type==2){ // その他の 一般ページ用
                if(event.ctrlKey==true){
                    step=1;
                    box_env2(img, 1);
                    ac_disp(0);
                    set_img(img);
                    ex_mag(); }}}

    } // light_box()



    let img_frame=document.querySelector('div[tabindex="0"]'); // 主画像フレーム
    if(img_frame){
        img_frame.onclick=function(event){
            event.stopImmediatePropagation();
            history.back(); } } // 画像一覧の画像表示枠のクリックで遷移元画面に



    path=location.pathname; // 現在のパス名
    if(path.split('/').pop()=='imagelist.html'){ // 画像リストページでのみ
        setTimeout(()=>{
            if(document.querySelector('#app main') // main要素
               && !document.querySelector('#app main img')){ // ユーザー画像
                location.reload();
            }}, 1000); } // 1sec待っても画像リストが取得できない時はリロード

} // catch_photo()



function box_env0(){
    let body=document.querySelector('body');

    let css=
        '<style id="light_style">'+
        '@keyframes fadeIn { 0% {opacity: 0} 100% {opacity: 1}} '+
        '.fin { animation: fadeIn .5s ease 0s 1 normal; animation-fill-mode: both; } '+
        '@keyframes fadeOut { 0% {opacity: 1} 100% {opacity: 0}} '+
        '.fout { animation: fadeOut .2s ease 0s 1 normal; animation-fill-mode: both; } '+
        '#lightbox { position: fixed; top: 0; left: 0; z-index: calc(infinity); visibility: hidden; '+
        'background: black; width: 100vw; height: 100vh; text-align: center; } '+
        '#photo_sw { position: fixed; width: 100%; height: 15%; user-select: none; } '+
        '#photo_sw:hover #photo_link { opacity: 1; } '+
        '#photo_link { position: absolute; top: 24px; left: 30px; height: 30px; '+
        'text-decoration: none; font: bold 21px Meiryo; padding: 3px 12px 0; '+
        'color: #000; background: #fff; border: 2px solid #000; border-radius: 6px; '+
        'cursor: pointer; opacity: 0; } '+
        '#photo_link svg { width: 28px; fill: currentColor; } '+
        '#photo_link svg.a { height: 24px; vertical-align: -4px; } '+
        '#photo_link svg.b { height: 22px; vertical-align: -3px; } '+
        '#photo_link svg.b { fill: red; } '+
        '#photo_link svg.c { height: 24px; vertical-align: -4px; fill: #bbb; } '+
        '#photo_sw:hover .bc { opacity: 1; } '+
        '#mag_sw { position: absolute; top: 24px; right: 30px; '+
        'display: flex; justify-content: flex-end; } '+
        '#ws, #ac, #bow { height: 24px; margin-left: 15px; box-sizing: content-box; '+
        'font: bold 22px/28px Meiryo; border-radius: 4px; overflow: hidden; cursor: pointer; '+
        'opacity: 0; } '+
        '#ws, #ac { padding: 0 5px; } '+
        '#ws svg { margin-right: -4px; vertical-align: -4px; } '+
        '#lbox_help { height: 24px; width: 24px; margin-left: 15px; font: bold 24px/29px Meiryo; '+
        'border: 2px solid #000; border-radius: 30px; cursor: pointer; opacity: 0; } '+
        '#photo_sw:hover #lbox_help { opacity: 1; } '+
        '#box_img { width: 96vw; height: 96vh; padding: 2vh 2vw; object-fit: contain; } '+
        '</style>';

    if(!body.querySelector('#light_style')){
        body.insertAdjacentHTML('beforeend', css); }


    let ud_SVG=
        '<svg height="23" width="23" viewBox="0 0 40 50">'+
        '<path style="fill: currentColor;" d="M20 6L13 21L28 21C25.9 15.9 23.5 '+
        '10.3 20 6M13 28L20 43C23.5 38.7 25.9 33.1 28 28L13 28z"></path>'+
        '</svg>';

    let svg_bow=
        '<svg width="24" height="24" viewBox="0 0 512 512">'+
        '<path style="fill:#fff" d="M0 0L0 510C34 485 63 448 92 419C100 411 109 '+
        '403 117 394C120 392 123 386 127 385C131 384 136 390 138 392C147 400 '+
        '157 407 168 414C199 429 233 436 268 433C379 423 453 305 414 200C406 '+
        '178 393 152 374 138L468 44C481 31 502 16 511 0L0 0z"/>'+
        '<path style="fill:#000" d="M511 0C499 17 481 30 466 45L374 137C397 168 '+
        '417 195 423 234C437 330 365 426 266 433C232 435 199 428 169 413C158 '+
        '407 148 400 139 392C136 390 132 384 127 385C124 385 120 391 118 '+
        '393C110 400 102 408 95 415L30 480C20 490 6 500 0 512L512 512L512 '+
        '153L512 47C512 33 516 13 511 0M128 382C158 360 184 327 210 301L373 '+
        '138C361 121 337 108 318 100C256 75 184 87 134 132C62 197 60 314 128 '+
        '382z"/></svg>';

    let box=
        '<div id="lightbox">'+
        '<div id="photo_sw">'+
        '<a id="photo_link"></a>'+
        '<div id="mag_sw">'+
        '<p id="ws" class="bc" title="拡大率：マウスホイールで調節">'+
        '<span id="wsv"></span>'+ ud_SVG +'</p>'+
        '<p id="ac" class="bc" title="Lightboxの起動操作"></p>'+
        '<p id="bow" class="bc" title="Lightboxの背景色">'+svg_bow+'</p>'+
        '<p id="lbox_help" class="bc">？</p>'+
        '</div>'+
        '</div>'+
        '<img id="box_img"></div>';

    if(!body.querySelector('#lightbox')){
        body.insertAdjacentHTML('beforeend', box); }

} // box_env0()



function box_env1(){
    with_cact=get_localst('Lightbox_cact');
    if(with_cact!=0 && with_cact!=1){
        with_cact=0; }
    localStorage.setItem('Lightbox_cact', with_cact); // Storage更新

    back_color=get_localst('Lightbox_back');
    if(back_color!='black' && back_color!='white'){
        back_color='black'; }
    localStorage.setItem('Lightbox_back', back_color); // Storage更新

    comic_w=get_localst('Lightbox_comic_w');
    if(isNaN(comic_w) || comic_w<20 || comic_w>90){
        comic_w=90; }
    localStorage.setItem('Lightbox_comic_w', comic_w); // Storage更新

    graphic_w=get_localst('Lightbox_graphic_w');
    if(!graphic_w || isNaN(graphic_w) || graphic_w<20 || graphic_w>400){
        graphic_w=200; }
    localStorage.setItem('Lightbox_graphic_w', graphic_w); // Storage更新

    zmode=get_localst('Lightbox_zmode');
    if(zmode!=0 && zmode!=1){
        zmode=0; }
    localStorage.setItem('Lightbox_zmode', zmode); // Storage更新

    ctrl_act();
    b_or_w();
    icon_color();
    zoom_mode();
    disp_wpm(disp_mode);
    help();

} // box_env1()



function ctrl_act(){
    let ac=document.querySelector('#ac');
    if(ac){
        if(with_cact==0){
            ac.textContent='Ctrl+Click'; }
        else{
            ac.textContent='Click'; }

        ac.onclick=function(event){
            event.stopImmediatePropagation();
            if(with_cact==0){
                with_cact=1;
                ac.textContent='Click'; }
            else{
                with_cact=0;
                ac.textContent='Ctrl+Click'; }
            localStorage.setItem('Lightbox_cact', with_cact); // Storage更新
            location.reload(); }}}



function b_or_w(){
    let lightbox=document.querySelector('#lightbox');
    lightbox.style.background=back_color; // 背景色をCookieから指定
    let bow=document.querySelector('#bow');
    if(bow){
        bow.onclick=function(event){
            event.stopImmediatePropagation();
            if(lightbox.style.backgroundColor!='white'){
                lightbox.style.backgroundColor='white';
                back_color='white'; }
            else{
                lightbox.style.backgroundColor='black';
                back_color='black'; }
            icon_color();
            localStorage.setItem('Lightbox_back', back_color); }}} // Storage更新



function icon_color(){
    let bc=document.querySelectorAll('#photo_sw .bc');
    for(let k=0; k<bc.length; k++){
        if(back_color=='black'){
            bc[k].style.color='white';
            bc[k].style.background='#000';
            bc[k].style.border='2px solid #fff'; }
        else{
            bc[k].style.color='black';
            bc[k].style.background='#fff';
            bc[k].style.border='2px solid #000'; }}}



function zoom_mode(){
    let ws=document.querySelector('#ws');
    let wsv=document.querySelector('#wsv');
    if(ws && wsv){
        ws.onclick=function(event){
            event.stopImmediatePropagation();
            let lightbox=document.querySelector('#lightbox');
            let box_img=document.querySelector('#box_img');

            if(zmode==0){
                zmode=1;
                wsv.textContent='Cz '+ comic_w;
                box_img.style.width=comic_w +'vw';
                lightbox.scrollTo(0, 0); }
            else{
                zmode=0;
                wsv.textContent='Gz '+ graphic_w;
                box_img.style.width=graphic_w +'vw';
                trim(); }

            zoom_set(zmode);
            localStorage.setItem('Lightbox_zmode', zmode); }}} // Storage更新



function disp_wpm(n){
    let ws=document.querySelector('#ws');
    if(ws){
        if(n==0){
            ws.style.visibility='hidden'; }
        else{
            ws.style.visibility='visible'; }}}



function help(){
    let lbox_help=document.querySelector('#lbox_help');
    if(lbox_help){
        lbox_help.onclick=function(event){
            event.stopImmediatePropagation();
            window.open('https://ameblo.jp/personwritep/entry-12778603499.html#manual',
                        null, 'width=820,height=800'); }}}



function zoom_set(mode){
    let photo_sw=document.querySelector('#photo_sw');
    let ws=document.querySelector('#ws');
    let wsv=document.querySelector('#wsv');


    function ac_check(element){
        let opa=window.getComputedStyle(element).getPropertyValue('opacity');
        if(opa=='1' && disp_mode==1){
            return true; }}


    if(photo_sw && ws && wsv){
        if(mode==0){
            wsv.textContent='Gz '+ graphic_w; }
        else{
            wsv.textContent='Cz '+ comic_w; }


        photo_sw.onwheel=function(event){ // マスウホイールで設定
            if(mode==0){ // Graphic mode
                if(event.deltaY<0 && ac_check(ws) && graphic_w<381){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    graphic_w=graphic_w*1 +20;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=graphic_w +'vw';
                        trim(); }
                    wsv.textContent='Gz '+ graphic_w;
                    localStorage.setItem('Lightbox_graphic_w', graphic_w); } // Storage更新
                else if(event.deltaY>0 && ac_check(ws) && graphic_w>139){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    graphic_w=graphic_w*1 -20;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=graphic_w +'vw';
                        trim(); }
                    wsv.textContent='Gz '+ graphic_w;
                    localStorage.setItem('Lightbox_graphic_w', graphic_w); }} // Storage更新

            else{ // Comic mode
                if(event.deltaY<0 && ac_check(ws) && comic_w<81){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    comic_w=comic_w*1 +10;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=comic_w +'vw';
                        trim(); }
                    wsv.textContent='Cz '+ comic_w;
                    localStorage.setItem('Lightbox_comic_w', comic_w); } // Storage更新
                else if(event.deltaY>0 && ac_check(ws) && comic_w>29){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    comic_w=comic_w*1 -10;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=comic_w +'vw';
                        trim(); }
                    wsv.textContent='Cz '+ comic_w;
                    localStorage.setItem('Lightbox_comic_w', comic_w); }}} // Storage更新

    } // if(photo_sw && ws && wsv)

} // zoom_set()



function trim(){
    let lightbox=document.querySelector('#lightbox');
    let box_img=document.querySelector('#box_img');
    let i_width=box_img.naturalWidth;
    let i_height=box_img.naturalHeight;
    let w_width= window.innerWidth;
    let w_height= window.innerHeight;

    let view_w=w_width*graphic_w/100;
    lightbox.scrollTo((view_w - w_width)/2,
                      ((view_w*i_height)/i_width - w_height)/2); }



function get_localst(name){
    if(!localStorage.getItem(name)){
        return 0; }
    else{
        return localStorage.getItem(name); }}



function box_env2(target_img, cont){ // リンクボタンの表示
    let photo_link=document.querySelector('#photo_link');
    if(photo_link){
        let link=target_img.closest('A');
        if(link && cont==1){
            if(link.classList.contains('detailOn')){
                photo_link.innerHTML=
                    '<svg class="a" viewBox="0 0 512 512">'+
                    '<path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 '+
                    '0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 '+
                    '24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 '+
                    '0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 '+
                    '120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 '+
                    '88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z"></path></svg>'+
                    ' Photo Storage'; }
            else{
                photo_link.innerHTML=
                    '<svg class="b" viewBox="0 0 512 512">'+
                    '<path d="M327 185c60 60 59 156.7.36 215-.11.12-.24.25-.36.37l-67 '+
                    '67c-59 59-156 59-215 0-59-59-59-156 0-215l37-37c10-10 27-3 27 '+
                    '10.6.6 18 4 36 10 53 2 5.8.6 12-4 17l-13 13c-28 28-29 74-1 102 28 '+
                    '29 74 29 102.3.5l67-67c28-28 28-74 0-102-4-4-7-7-10-9a16 16 0 0 '+
                    '1-7-13c-0-11 3-21 12-30l21-21c6-6 14-6 21-2a152 152 0 0 1 21 '+
                    '17zM468 44c-59-59-156-59-215 0l-67 67c-.1.1-.3.3-.4.4-59 59-59 '+
                    '154.8.4 215a152 152 0 0 0 21 17c6 4 15 4 21-2l21-21c8-8 12-19 '+
                    '12-30a16 16 0 0 0-7-13c-3-2-7-5-10-9-28-28-28-74 0-101l67-67c28-28 '+
                    '74-28 102.3.5 28 28 27 74-1 102l-13 13c-4 4-6 11-4 17 6 17 9 35 10 '+
                    '52.7.5 14 17 20 27 11l37-37c59-59 59-155.7.0-215z"></path></svg>'+
                    ' Linked Page'; }
            photo_link.setAttribute('href', link.getAttribute('href')); // リンクのコピー
            photo_link.style.visibility='visible'; }

        else if(!link && cont==1){ // 画像ストレージのリンクが無いユーザー画像の場合
            let image_src=target_img.getAttribute('src');
            if(image_src.startsWith('https://stat.ameba.jp/user_images')){
                let entry_id=target_img.getAttribute('data-entry-id');
                let image_id=target_img.getAttribute('data-image-id');
                let entry=document.querySelector('.js-entryWrapper');
                if(entry){
                    let ameba_id=entry.getAttribute('data-unique-ameba-id');
                    let link_href='https://ameblo.jp/'+
                        ameba_id +'/image-'+entry_id +'-'+ image_id +'.html';
                    photo_link.innerHTML=
                        '<svg class="c" viewBox="0 0 512 512">'+
                        '<path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 '+
                        '0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 '+
                        '24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 '+
                        '0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 '+
                        '120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 '+
                        '88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z"></path></svg>'+
                        ' Photo Storage Presumed';
                    photo_link.setAttribute('href', link_href); // 画像から得たリンクの設定
                    photo_link.style.visibility='visible'; }}
            else{
                photo_link.style.visibility='hidden'; }}

        else{
            photo_link.style.visibility='hidden'; }

        photo_link.onclick=function(event){
            event.stopImmediatePropagation(); }}}



function ac_disp(n){
    let ac=document.querySelector('#ac');
    if(ac){
        if(n==0){
            ac.style.visibility='hidden'; }
        else{
            ac.style.visibility='visible'; }}}



function set_img(target_img){
    let lightbox=document.querySelector('#lightbox');
    let box_img=lightbox.querySelector('#box_img');
    let img_src=target_img.getAttribute('src');
    let img_url;

    if(img_src.indexOf('?caw=')!==-1){
        img_url=img_src.split('?caw=')[0]; }
    else if(img_src.indexOf('?cat=')!==-1){
        img_url=img_src.split('?cat=')[0]; }
    else {
        img_url=img_src; }

    if(lightbox && img_url!=''){
        e_free=1; // 許可

        html_.style.overflow='hidden';
        box_img.src=img_url;
        lightbox.style.visibility='visible';
        zoom_reset(lightbox);
        lightbox.classList.remove('fout');
        lightbox.classList.add('fin'); }}



function zoom_reset(l_box){
    let body=document.querySelector('body');
    let zoom_f=window.getComputedStyle(body).getPropertyValue('zoom');
    if(zoom_f || zoom_f!=1){ // bodyで拡大ツールによるのzoom指定がある場合
        l_box.style.zoom=1/zoom_f; }}



function ex_mag(){
    let html_=document.querySelector('html');
    let lightbox=document.querySelector('#lightbox');
    let box_img=lightbox.querySelector('#box_img');

    if(lightbox){
        lightbox.onclick=function(event){ // 拡張ディスプレイモード
            event.preventDefault();

            hide_photo_link(); // 画像一覧へのリンクを無効化

            let i_width=box_img.naturalWidth;
            let i_height=box_img.naturalHeight;
            let w_width= window.innerWidth;
            let w_height= window.innerHeight;


            if(!event.ctrlKey && !event.shiftKey){ // 元の表示に戻る
                step=0;
                e_free=0; // 不許可

                html_.style.overflow='inherit';
                lightbox.classList.remove('fin');
                lightbox.classList.add('fout');
                lightbox.style.overflow='hidden'; // overflowのリセット
                box_img.style.height='96vh';
                box_img.style.width='96vw';
                box_img.style.padding='2vh 2vw';
                setTimeout(()=>{
                    lightbox.style.visibility='hidden';
                    box_img.src='';
                }, 200);
                disp_mode=0; // 拡張ディスプレイモード リセット
                disp_wpm(0); }

            else{
                if(event.shiftKey){ //「Ctrl+Shift」または「Shift」の押下
                    if(zmode==0){
                        zmode=1; }
                    else{
                        zmode=0; }
                    localStorage.setItem('Lightbox_zmode', zmode); // Storage更新
                    zoom_set(zmode);
                    ex_mode_2(event, zmode); }

                else{ //「Ctrl」のみ押下
                    zoom_set(zmode);
                    ex_mode(event, zmode); }}



            function ex_mode(event, mode){
                if(disp_mode==0){
                    disp_mode=1; // 拡張ディスプレイモード
                    disp_wpm(1);
                    lightbox.style.overflow='auto';
                    box_img.style.height='auto';
                    box_img.style.padding='1vh 1vw';

                    if(mode==0){
                        box_img.style.width=graphic_w +'vw';
                        mag_point(event); }
                    else{
                        box_img.style.width=comic_w +'vw';
                        lightbox.scrollTo(0, 0); }}

                else{
                    disp_mode=0; // 拡張ディスプレイモード リセット
                    disp_wpm(0);
                    lightbox.style.overflow='hidden';
                    box_img.style.height='96vh';
                    box_img.style.width='96vw';
                    box_img.style.padding='2vh 2vw'; }

            } // ex_mode()



            function ex_mode_2(event, mode){
                if(disp_mode==0){
                    disp_mode=1; // 拡張ディスプレイモード
                    disp_wpm(1);
                    lightbox.style.overflow='auto';
                    box_img.style.height='auto';
                    box_img.style.padding='1vh 1vw'; }

                if(mode==0){
                    box_img.style.width=graphic_w +'vw';
                    trim(); }
                else{
                    box_img.style.width=comic_w +'vw'; }

            } // ex_mode_2()



            function mag_point(event){
                let lightbox=document.querySelector('#lightbox');
                let box_img=lightbox.querySelector('#box_img');
                let actal_x; // Actual Pixels表示スクロールx値
                let actal_y; // Actual Pixels表示スクロールy値

                let nwidth=box_img.naturalWidth;
                let nhight=box_img.naturalHeight;
                let ratio=nwidth/nhight
                let top=event.offsetY;
                let left=event.offsetX;
                let ww=lightbox.clientWidth;
                let wh=lightbox.clientHeight;

                if(ww<wh*ratio){
                    actal_x=(left*graphic_w/100) - ww/2;
                    actal_y=(2*top - wh + ww/ratio)*graphic_w/200 - wh/2; }
                else{
                    let zk=((2*left - ww)/wh/ratio + 1)/2;
                    actal_x=(zk*graphic_w -50)*ww/100;
                    actal_y=(top*ww*graphic_w)/(wh*ratio*100) - wh/2; }

                lightbox.scrollTo(actal_x, actal_y); }

        }}} // ex_mag()



function hide_photo_link(){
    let photo_link=document.querySelector('#photo_link');
    if(photo_link){
        photo_link.style.visibility='hidden'; }}



function key_press(event){
    c_press=event.ctrlKey; } // Ctrlキー押下の true false を取得

document.addEventListener("keyup", key_press, {passive: false});
document.addEventListener("keydown", key_press, {passive: false});

function weel_idle(event){
    if(c_press && step>0){
        event.preventDefault(); }}

window.addEventListener("mousewheel", weel_idle, {passive: false});
window.addEventListener("wheel", weel_idle, {passive: false});
