;(function(window, document, $, undefined){
    /**
     * v0.1 @20200324
     */
    // 自定义事件(发布订阅模式)
    function EventTarget(){
        this.handlers = {};
    }
    EventTarget.prototype = {
        constructor: EventTarget,
        // 注册给定类型事件的事件处理程序
        addHandler: function(type, handler){
            if ( typeof this.handlers[type] == "undefined" ) {
                this.handlers[type] = [];
            }
            this.handlers[type].push( handler );
        },
        // 注销某个事件类型的事件处理程序
        removeHandler: function(type, handler){
            if ( this.handlers[type] instanceof Array ) {
                var handlers = this.handlers[type];
                for ( var i=0, len=handlers.length; i<len; i++ ) {
                    if ( handlers[i] === handler ) {
                        break;
                    }
                }
                handlers.splice(i, 1);
            }
        },
        // 触发一个事件
        fire: function(event){
            if ( !event.target ) {
                event.target = this;
            }
            if ( this.handlers[event.type] instanceof Array ) {
                var handlers = this.handlers[event.type];
                for ( var i=0, len=handlers.length; i<len; i++ ) {
                    handlers[i](event);
                }
            }
        }
    };
    // 拖放功能。拖动功能对包含draggable类的元素启用。定义了三个事件:dragstart, drag, dragend
    // 对于mdraggable类的元素，不发生实际拖动，但是途中会触发了三个事件，mdragstart, mdrag, mdragend
    var DragDrop = (function(){
        var dragdrop = new EventTarget(), dragging = null, mdragging = null, diffX = 0, diffY = 0;
        function handleEvent(event){
            // 获取事件和事件目标对象
            event = event || window.event;  // ie中是window.event
            var target = event.target || event.srcElement;  // ie中是srcElement
            // 确定事件类型
            switch( event.type ){
                case 'mousedown':
                    // clientX是事件发生时鼠标到视口左边的距离，offsetLeft是目标元素target到视口左边的距离  
                    diffX = event.clientX - target.offsetLeft;  // 鼠标到元素左边界的距离
                    diffY = event.clientY - target.offsetTop;   // 鼠标到元素上边界的距离
                    // 因为"mdraggable".indexOf("draggable")也能找到，所以这儿"mdraggable"的逻辑应该放在前边
                    if ( target.className.indexOf("mdraggable") > -1 ) {
                        mdragging = target;
                        dragdrop.fire( {type:"dragstart", target:mdragging, x:event.clientX, y:event.clientY, origEvent:event,
                                         diffX:diffX, diffY:diffY} );  // origEvent:原始的事件
                    } else if ( target.className.indexOf("draggable") > -1 ) {
                        dragging = target;
                        dragdrop.fire( {type:"dragstart", target:dragging, x:event.clientX, y:event.clientY, origEvent:event,
                                        diffX:diffX, diffY:diffY} );
                    }
                    break;
                case 'mousemove': 
                    if ( dragging !== null ) {
                        // 指定位置，修护拖动时鼠标跑到目标元素左上角的bug
                        dragging.style.left = ( event.clientX - diffX ) + "px";
                        dragging.style.top = ( event.clientY - diffY ) + "px";
                        // 触发自定义事件
                        dragdrop.fire( {type:"drag", target:dragging, x:event.clientX, y:event.clientY, origEvent:event} );
                    } else if ( mdragging !== null ){
                        dragdrop.fire( {type:"drag", target:mdragging, x:event.clientX, y:event.clientY, origEvent:event} );
                    }
                    break;
                case 'mouseup':
                    if ( dragging !== null ) {
                        dragdrop.fire( {type:"dragend", target:dragging, x:event.clientX, y:event.clientY, origEvent:event} );
                    } else if ( mdragging !==null ){
                        dragdrop.fire( {type:"dragend", target:mdragging, x:event.clientX, y:event.clientY, origEvent:event} );
                    }
                    mdragging = null;
                    dragging = null;
                    break;
            }
        }
        dragdrop.enable = function(){
            document.addEventListener("mousedown", handleEvent);
            document.addEventListener("mousemove", handleEvent);
            document.addEventListener("mouseup", handleEvent);
        };
        dragdrop.disable = function(){
            document.removeEventListener("mousedown", handleEvent);
            document.removeEventListener("mousemove", handleEvent);
            document.removeEventListener("mouseup", handleEvent);
        };
        return dragdrop;
    })();

    // 在bigDiv上添加tinyDiv。都可以旋转、放大、缩小、拖动.支持ie9+
    // bigDiv的背景图片是bg, tinyDiv的背景图片是ico
    var FixIco = function( conf ){
        this.init( conf );
    }
    // 定义别名
    var _f = FixIco;
    FixIco.fn = FixIco.prototype;

    // 给类添加属性
    FixIco.extend = function( obj ){
        var extended = obj.extended;
        for ( var i in obj ) {
            FixIco[i] = obj[i];
        }
        if ( extended ) { extended(FixIco); }
    };
    // 给实例添加属性
    FixIco.include = function( obj ){
        var included = obj.included;
        for ( var i in obj ) {
            FixIco.prototype[i] = obj[i];
        }
        if ( included ) { included(FixIco); }
    };

    // 给类添加方法
    FixIco.extend({
        // 给元素或元素数组设置css样式
        css: function(els, obj){
            var isArray = Array.isArray(els);
            for ( var i in obj) {
                if (isArray) {
                    els.forEach( function(item){ item.style[i] = obj[i]; } );
                } else {
                    els.style[i] = obj[i];
                }
            }
        },
        // 生成128位全局唯一标识符guid(默认第一位是字母G).
        generateGUID: function( preStr ){
            var guid = 'gxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); // Math.random()*16|0获取0~15的整数
                return v.toString(16);  // toString(16)将数字转换为16进制的字符串
            }).toUpperCase();
            return typeof preStr === 'string' ? preStr + guid : guid;
        },
        // 创建新的样式表。 css是css样式字符串
        loadStyleString: function( css ){
            var style = document.createElement('style');
            style.type = "text/css";
            try {
                style.appendChild( document.createTextNode(css) );  // 标准dom
            } catch( ex ) {
                // IE将<style>、<script>视为特殊节点，不允许访问其子节点。故捕获IE报错，再针对进行特殊处理
                // 解决方法是访问元素的styleSheet属性,该属性又有一个cssText属性，可以接受css代码
                style.styleSheet.cssText = css;
            }
            document.getElementsByTagName('head')[0].appendChild( style );
        },
        // 获取图片的真实尺寸大小
        getImgRealSize: function( imgsrc, cb ){
            var img = new Image();
            img.src = imgsrc;
            img.onload = function(){
                console.log('图片真实大小', img.width, img.height);
                cb( img.width, img.height );        
            }
        },
        // 加上单位px. obj：{ string|number|object }
        addpx: function(obj){
            var rwillAddPx = /^(?:width|height|left|top)$/;
            var self = this;
            // obj是数字，或指定的字符串加px
            if ( typeof obj === 'number' || rwillAddPx.test(obj) ) {
                return obj + 'px';        
            } else if (typeof obj === 'object') {
                for (var i in obj) {
                    if ( obj.hasOwnProperty(i) && rwillAddPx.test(i) ) {
                        obj[i] = self.addpx( obj[i] );
                    }
                }
                return obj;
            } else {
                return obj;
            }
        },
        // 去掉单位px
        rmpx: function(obj){
            var self = this;
            if (typeof obj === 'string') {
                return obj.slice(-2) === 'px' ? +obj.slice(0, -2) : +obj;      
            } else if (typeof obj === 'object') {
                for (var i in obj) {
                    if ( obj.hasOwnProperty(i) ) {
                        obj[i] = self.rmpx( obj[i] );
                    }
                }
                return obj;
            } else {
                return obj;
            }
        },
        // 获取鼠标到finalTarget对象的距离(在缩放图片中就是缩放距离)
        getCursorPosition: function(event, finalTarget){
            finalTarget = finalTarget ? finalTarget : null; // 当为null时，取到body边界的距离
            var styleLeft = event.offsetX,
                styleTop = event.offsetY,
                current = event.target;
            while ( current !== finalTarget ) {
                styleLeft += current.offsetLeft;
                styleTop += current.offsetTop;
                current = current.offsetParent;
            }
            return { left: styleLeft, top: styleTop};
        },

    });
    
    // 给实例添加方法
    FixIco.include({
        init: function( conf ){
            var me = this;
            console.warn('判断下', me, FixIco);
            var defconf = { // 默认配置
                width: 600,
                height: 500,
                pattern: 'bg',      // 展示模式，img，bg
                cells: {            // 设置big的扩展区域部分
                    top: {
                        exist: false,                               // 是否存在topCell(上部操作区)
                        id: _f.generateGUID(),                      // topCell的id值
                        pst: {left:0, top:0, width:0, height:0},    // topCell的位置(left,top)及宽高（wdith,height）都是像素
                        html: function(){ return '' },              // topCell的html
                        css: function(){ return {} },               // topCell的css
                        init: function(){ },                        // topCell的初始化函数
                    },
                    bottom: {
                        exist: false, 
                        id: _f.generateGUID(),
                        pst: {left:0, top:0, width:0, height:0},
                        html: function(){ return '' },
                        css: function(){ return {} },
                        init: function(){ }
                    },
                    left: {
                        exist: false, 
                        id: _f.generateGUID(),
                        pst: {left:0, top:0, width:0, height:0},
                        html: function(){ return '' },
                        css: function(){ return {} },
                        init: function(){ }
                    },
                    right: {
                        exist: false, 
                        id: _f.generateGUID(),
                        pst: {left:0, top:0, width:0, height:0},
                        html: function(){ return '' },
                        css: function(){ return {} },
                        init: function(){ }
                    },
                },
                topCell: 0,         // 上部操作区所占部分0%
                bottomCell: 0,      // 下部操作区所占
                leftCell: 0,
                rightCell: 0,
                styles: {},
                big: {
                    src: '',
                    id: '',
                    naturalWidth: 0,
                    naturalWidth: 0,
                },                  // 用于存放big对象的信息
                tinys:{},           // 用于存放tinydiv
                bigId: _f.generateGUID(),   // 大Div的id
                defTinyWidth: '50px',  // 小div的宽
                defTinyHeight: '50px',
                format: 'image/png',
                zIndex: 1000,       // 默认的z-index
                rotateAngle: 0,     // 背景旋转角度
                scale: 1,           // 缩放比例
                scaleable: true,    // 是否可缩放。true:可缩放，false:不可缩放
                moveable: true,     // 是否可移动
                selectable:true,    // tiny是否可选中
                disableSelectId:{},   // 不可选中的id
                disableMoveId:{},       // 不可移动的id
                allowDrawOutBig: true,  // 允许手绘tinyDiv时超出big的范围
                allowMoveOutBig: false,  // 允许拖动tinyDiv时超出big的范围
                mainCellFn: function(){},       // mainCell初始化函数
                dragendFn: function(){},     // dragend触发的函数
            };
            me.records = {};    // 存储对象
            me.original = {};   // 存储所有bg和tiny的原始参数
            me.selectedTiny = [];   // 存储选中的tiny
            me.conf = $.extend( true, {}, defconf, conf );
            me.dom = me.conf.dom;
            me.el = document.getElementById( me.dom );
            me.ids = {};
            me.class = {};
            me.ids.out = _f.generateGUID();
            me.ids.big = _f.generateGUID();
    
            me.conf.big.src = me.conf.src || '';
            me.conf.big.id = me.ids.big;

            me.initStyles();
            me.initHtml();
            DragDrop.enable();      // 开启拖放功能
            me.bindEvents();        // 绑定事件
            // cssText可以一次设置或获取多个样式属性值。注意:这只能获取内联样式值。设置时会覆盖以前的元素样式属性值
            // this.el.style.cssText="width:500px;height:400px;padding:10px;";
        },
        initStyles: function(){
            var me = this, styles = {};
            var conf = me.conf,
                styles = conf.styles || (conf.styles = {}),
                cells = conf.cells,
                leftPst, rightPst, topPst, bottomPst,
                outPst = {left: 0, top: 0, width: conf.width, height: conf.height},
                cellBaseStyles = { position:'absolute', margin:0, padding:0, border:0, overflow:"hidden",
                                   outline:"2px solid #333", zIndex: me.conf.zIndex };

            outPst.left = cells.left.exist ? cells.left.pst.left + cells.left.pst.width : 0;
            outPst.top = cells.top.exist ? cells.top.pst.top + cells.top.pst.height : 0;
            outPst.width = cells.right.exist ? Math.abs(cells.right.pst.left - outPst.left) : Math.abs(conf.width - outPst.left);
            outPst.height = cells.bottom.exist ? Math.abs(cells.bottom.pst.top - outPst.top) : Math.abs(conf.height - outPst.top);
            me.mainCell = outPst;

            leftPst   = { width: cells.left.pst.width + 'px', height: cells.left.pst.height + 'px',
                              left: cells.left.pst.left + 'px', top: cells.left.pst.top + 'px' };
            rightPst  = { width: cells.right.pst.width + 'px', height: cells.right.pst.height + 'px',
                              left: cells.right.pst.left + 'px', top: cells.right.pst.top + 'px' };
            topPst    = { width: cells.top.pst.width + 'px', height: cells.top.pst.height + 'px',
                              left: cells.top.pst.left + 'px', top: cells.top.pst.top + 'px' };
            bottomPst = { width: cells.bottom.pst.width + 'px', height: cells.bottom.pst.height + 'px',
                              left: cells.bottom.pst.left + 'px', top: cells.bottom.pst.top + 'px' };
            outPst    = _f.addpx(outPst);
            
            styles[ cells.left.id ]   = $.extend( true, {}, cellBaseStyles, leftPst, cells.left.css() );
            styles[ cells.right.id ]  = $.extend( true, {}, cellBaseStyles, rightPst, cells.right.css() );
            styles[ cells.top.id ]    = $.extend( true, {}, cellBaseStyles, topPst, cells.top.css() );
            styles[ cells.bottom.id ] = $.extend( true, {}, cellBaseStyles, bottomPst, cells.bottom.css() );
            styles[ me.ids.out ]      = $.extend( true, {}, cellBaseStyles, outPst, {zIndex: me.conf.zIndex++} );

            styles[ me.ids.big ] = { position:"absolute", left:"10%", top:"10%", width:"80%", height:"80%", 
                                    margin:0, padding:0, border:0, zIndex: me.conf.zIndex++, outline:'1px dashed #f00' };
            styles[ me.conf.dom ] = { width:me.conf.width+'px', height:me.conf.height+'px' };
        },
        // 初始化页面
        initHtml: function(){
            var me = this, html,
                cells = me.conf.cells,
                bigDivStr = '<div id="' + me.ids.big + '" class="mdraggable"></div>',
                bigImgStr = '<img id="' + me.ids.big + '" class="mdraggable" draggable="false" src="">',
                big = me.conf.pattern === 'bg' ? bigDivStr : bigImgStr;

            var topCell = cells.top.exist ? '<div id="' + cells.top.id + '">' + cells.top.html()  + '</div>' : '',
                bottomCell = cells.bottom.exist ? '<div id="' + cells.bottom.id + '">' + cells.bottom.html()  + '</div>' : '',
                leftCell = cells.left.exist ? '<div id="' + cells.left.id + '">' + cells.left.html()  + '</div>' : '',
                rightCell = cells.right.exist ? '<div id="' + cells.right.id + '">' + cells.right.html()  + '</div>' : '',
                outCell = '<div id="' + me.ids.out +'">' + big + '</div>';

            html = topCell + leftCell + outCell + bottomCell + rightCell;
            me.el.innerHTML = html;
            $('#'+me.conf.dom).css( me.conf.styles[ me.conf.dom ]);
            $('#'+me.ids.out).css( me.conf.styles[ me.ids.out ] );
            $('#'+me.ids.big).css( me.conf.styles[ me.ids.big ] );
            // leftCell, rightCell, topCell, bottomCell区域初始化
            if (cells.left.exist) {
                $('#'+cells.left.id).css( me.conf.styles[ cells.left.id ] );
                cells.left.init(me);
            }
            if (cells.right.exist){
                $('#'+cells.right.id).css( me.conf.styles[ cells.right.id ] );
                cells.right.init(me);
            }
            if (cells.top.exist) {
                $('#'+cells.top.id).css( me.conf.styles[ cells.top.id ] );
                cells.top.init(me);
            }
            if (cells.bottom.exist) {
                $('#'+cells.bottom.id).css( me.conf.styles[ cells.bottom.id ] );
                cells.bottom.init(me);
            }
            // 替换big的背景。没传值则隐藏，传了值则替换
            me.replaceBigImg(me.conf.src);
            me.conf.mainCellFn(me);    // mainCell区域初始化
        },
        //获取所有的数据。偏移相当于out的左上角。 isOrigin:换算为缩放前的偏移和位置
        getAllData: function( isOrigin ) {
            var me = this,
                // tinysPst:tinysDiv的位置(相对于outDiv)，tinysPstAboutBig:tinyDiv的位置(相对于bigDiv), overTinys:越bigDiv边界的tinysDiv及其越界情况
                obj = { tinysPst:{}, overTinys:{}, tinysPstAboutBig:{} },  
                bigPst = me.getPst( me.readInfo(me.ids.big) ),
                newBigPst = me.calcBigRange( bigPst, me.conf.rotateAngle ), // 当前旋转角度下bigDiv的位置
                getOrigin = function( pst, scale ){
                    return { left: pst.left/scale, top: pst.top/scale, width: pst.width/scale, height: pst.height/scale };
                }; 
            obj.scale = me.conf.scale;                  // 缩放比例
            obj.rotateAngle = me.conf.rotateAngle;      // 旋转角度
            obj.bigPst = isOrigin ? getOrigin( newBigPst, obj.scale ) : newBigPst;  // bigDiv的位置
            for ( var id in me.conf.tinys ) {
                var tinyPst = me.getPst( me.readInfo(id) ),
                    state = me.checkTinyPstAboutBigDiv( tinyPst, newBigPst );       // 获取tinyDiv相对于当前旋转角度下bigDiv的位置关系
                if ( !state.inDiv ) { obj.overTinys[id] = state; }
                obj.tinysPst[id] = isOrigin ? getOrigin( tinyPst, obj.scale ) : tinyPst;
            }
            return obj;
        },
        // 获取选中tiny的id值。 返回选中tiny的数组。eg: [tiny2Id, tiny5Id]
        getSelectedTiny: function(){
            return this.selectedTiny;
        },
        // // 更换背景图片，并使图片在out中尽量展示更多
        // replaceBigBg: function( newBg ){
        //     var me = this;
        //     _f.getImgRealSize( newBg, function( imgWidth, imgHeight ){
        //         // 根据背景图片大小更改big的大小和位置
        //         var out = $( '#'+me.ids.out )[0],
        //             outWidth = out.clientWidth,     // out的宽度，只包括content+padding
        //             outHeight = out.clientHeight;   // out的高度，只包括content+padding
        //         var info = me.calcInitPstAndScale( outWidth, outHeight, imgWidth, imgHeight );
        //         // console.log('图片信息' + outWidth, outHeight, imgWidth, imgHeight, info);
        //         me.conf.scale = info.scale;
        //         delete info.scale;
        //         $( '#'+me.ids.big ).css( info );
        //         // 更改big的背景图片
        //         me.replaceBg( me.ids.big, newBg );
        //         me.storeInfo( me.ids.big, info );
        //     });
        // },
        // // 更换tinyDiv的背景图片。 格式：id:tinyDiv的id值, newIco:新图片的src
        // replaceTinyBg: function( id, newIco ){
        //     var me = this;
        //     // 判断id是属于tinyDiv的
        //     if ( !me.conf.tinys[ id ] ) { console.log('你输入的id不正确'); return false; }
        //     _f.getImgRealSize(newIco, function(imgWidth, imgHeight){
        //         var scaleWidth = imgWidth * me.conf.scale,
        //             scaleHeight = imgHeight * me.conf.scale ;
        //         $( '#'+id ).css( _f.addpx( {width: scaleWidth, height: scaleHeight} ) );
        //         me.replaceBg( id, newIco );
        //         me.storeInfo( id, { width: scaleWidth, height: scaleHeight } );
        //     });
        // },
        // 替换big图片或bigDiv的背景图片，并使图片在out中尽量展示更多
        replaceBigImg: function(newImg){
            var me = this;
            // 取消big图片并隐藏
            if (!newImg) {
                if (me.conf.pattern === 'bg') {
                    me.replaceBg( me.ids.big, '');
                } else if (me.conf.pattern === 'img') {
                    me.replaceImgSrc(me.ids.big, '')
                }
                $('#'+me.ids.big).css({visibility: "hidden"});    // 隐藏
                me.storeInfo(me.ids.big, {width: 0, height: 0});
                return me;
            }
            // 更换big图片
            _f.getImgRealSize(newImg, function(imgWidth, imgHeight){
                // 根据背景图片大小更改big的大小和位置
                var out = $('#'+me.ids.out)[0],
                    outWidth = out.clientWidth,         // out的宽度，只包括content+padding
                    outHeight = out.clientHeight;       // out的高度，只包括content+padding
                var info = me.calcInitPstAndScale(outWidth, outHeight, imgWidth, imgHeight);
                me.original[me.ids.big] = { width:imgWidth, height:imgHeight };
                me.conf.initBigPst = $.extend(true, {}, info);  // 存储big初始化时的参数。此时big能最大化显示
                me.conf.scale = info.scale;
                me.conf.bigsrc = newImg;
                delete info.scale;
                $('#'+me.ids.big).css({visibility: "inherit"});   // 取消隐藏
                $('#'+me.ids.big).css(info);
                if (me.conf.pattern === 'bg') {
                    me.replaceBg(me.ids.big, newImg);
                } else if (me.conf.pattern === 'img') {
                    console.log('replaceBigImg', newImg, me.ids.big);
                    me.replaceImgSrc(me.ids.big, newImg)      // todo:更换个图片用了三个api,也许可以合并一下
                }
                me.storeInfo(me.ids.big, info);
                me.resizeWidthAndHeight();
            });
        },
        // 恢复big和tiny的初始位置和偏移
        recoverInit: function(){
            var me = this,
                info = me.conf.initBigPst ? $.extend(true, {}, me.conf.initBigPst) : null;
            console.log('info',info, me.conf.scale, me.conf.rotateAngle);
            if (info) {
                // 重置big的偏移,宽高
                var bigCenterX = info.left + info.width / 2,
                    bigCenterY = info.top + info.height / 2,
                    nowScale = me.conf.scale = +info.scale,     // 重置后的缩放值
                    nowRotateAngle = me.conf.rotateAngle = 0,   // 重置后的旋转角度
                    $big = $('#'+me.ids.big);
                delete info.scale;
                me.rotateOne(me.ids.big, nowRotateAngle); 
                $big.css( _f.addpx(info) );
                me.storeInfo(me.ids.big, info);
                // 重置所有tiny的缩放，宽高
                for (var id in me.conf.tinys) {
                    var originalStyle = me.original[ id ];    // img或div的原始宽高
                    var newStyle = {
                        width: originalStyle.width * nowScale, 
                        height: originalStyle.height * nowScale,
                        left: bigCenterX,
                        top: bigCenterY
                    };
                    $('#'+id).css( _f.addpx(newStyle) );
                    me.storeInfo(id, newStyle);
                }
            }
        },
        // 更换tiny的背景图片或其内的图片. id:tiny的id值(string)或位置值(number) newIco:新图片的src
        replaceTinyImg: function(id, newIco){
            var me = this;
            if ( typeof id === 'number' ) { id = Object.keys(me.conf.tinys)[id] }
            if ( !me.conf.tinys[id] ) { return false; }     // 输入的id不存在
            _f.getImgRealSize(newIco, function(imgWidth, imgHeight){
                var scaleWidth = imgWidth * me.conf.scale,
                    scaleHeight = imgHeight * me.conf.scale;    
                me.original[id] = { width: imgWidth, height: imgHeight };   // 存储tiny的真实宽高
                $('#'+id).css( _f.addpx({width: scaleWidth, height: scaleHeight}) );
                if (me.conf.pattern === 'img') {
                    me.replaceImgSrc(id, newIco);
                } else if (me.conf.pattern === 'bg') {
                    me.replaceBg(id, newIco);
                }
                me.storeInfo(id, {width: scaleWidth, height: scaleHeight});
            });
        },
        // 替换图片的src  el:图片的id或图片对象
        replaceImgSrc: function(el, newImg){
            if ( typeof el === 'string' ) {
                // 取消图片可拖动，即取消drop拖放事件，不然无法连续触发mousemove事件
                $('#'+el).attr( {'src': newImg, 'draggable': 'false'} );
            } else {
                $(el).attr( {'src': newImg, 'draggable': 'false'} );
            }
        },
        // 替换div显示的背景图片 newImg:新图片的路径，字符串
        replaceBg: function( id, newImg ){
            // 背景颜色，图片地址，图片定位，图片宽高，图片不重复
            var style = 'transparent url("' + newImg + '") left top / 100% 100% no-repeat';
            $( '#'+id ).css( { background: style } );
        },
        // 获取旋转后的角度。isClockwise：是否是顺时针变化
        getRotateDeg: function(  oldRotateDeg, isClockwise ){
            var angles = [0, 90, 180, 270], i = angles.indexOf(oldRotateDeg);
            return isClockwise ? angles[ (i+1) % 4] : angles[ (i+4-1) % 4 ];
        },
        // 标准计算公式。计算一点的位置(x0,y0)在相对于中心点(rx0,ry0)旋转a弧度后的位置.
        // x0,y0是点坐标位置，是相对于数学直角坐标系坐标原点的坐标
        // rx0,ry0:是旋转中心点。a:顺时针旋转的弧度(也可为度数，因为js的三角计算公式需要弧度，所以这儿值为弧度)
        calcRotatePoint: function( x0, y0, rx0, ry0, a ){
            var pst1 = {};
            // 点(x0,y0)绕原点逆时针旋转到(x1,y1)的公式：x1 = x0*cos(a) - y0*sin(a); y1 = y0*cos(a) + x0*sin(a)
            // 因cos(-a) = cos(a), sin(-a) = -sin(a)。所以
            // 点(x0,y0)绕原点顺时针旋转到(x1,y1)的公式：x1 = x0*cos(a) + y0*sin(a); y1 = y0*cos(a) - x0*sin(a)
            // 如果旋转中心为(rx0,ry0)，则需要把(rx0,ry0)沿着向量(-rx0,-ry0)移动到原点后再计算。
            // 此时(x0,y0)变成(x0-rx0, y0-ry0), (x1,y1)变成(x1-rx0, y1-ry0)。整理得点(x0,y0)绕(rx0,ry0)旋转a弧度后的位置：
            // x1 = (x0-rx0)*cos(a) + (y0-ry0)*sin(a)+rx0; y1 = (y0-ry0)*cos(a)-(y0-rx0)*sin(a)+ry0
            pst1.x = (x0-rx0) * Math.cos(a) + (y0-ry0) * Math.sin(a) + rx0;
            pst1.y = (y0-ry0) * Math.cos(a) - (x0-rx0) * Math.sin(a) + ry0;
            return pst1;
        },
        // 计算一个点旋转变换后的偏移
        // left0,top0：变换前 点 的偏移， rleft0,rtop0: 旋转中心点的偏移。相当于div坐标系原点(out的左上角)的偏移(不是数学上的直角坐标系),
        // deg0,deg1: 旋转前后的旋转角度
        calcPointPstWhenRotate: function( left0, top0, rleft0, rtop0, deg0, deg1 ){
            // 因为left和top值与数学中的直角坐标系有点不同，所以需要变换一下(如果以out的左上角为坐标原点，则x0=left,y0=-top)。
            var me = this, pst1, pst = {},
                x0 = left0, y0 = -top0, rx0 = rleft0, ry0 = -rtop0,
                a = (deg1 - deg0) * (Math.PI / 180);    // 旋转弧度。从0,90,180,270,应该算是顺时针旋转，用顺时针旋转公式
            pst1 = me.calcRotatePoint( x0, y0, rx0, ry0, a );
            pst.left = pst1.x;
            pst.top = -pst1.y;
            return pst;
        },
        // 旋转big到某个角度，tiny的位置也跟着相对移动
        rotateTo: function(degree, cb){
            var me = this,
                oldDeg = me.conf.rotateAngle,
                newDeg = degree;
            me.conf.rotateAngle = newDeg;
            // // 旋转big(以big的中心点旋转)
            // me.rotateOne( me.ids.big, newDeg, function(){   
            //     // todo:可使用getTinyDivNewPstWhenBigDivRotate函数替换
            //     // 修正tinyDiv的位置，使其中心点相对于旋转后的bigDiv位置不变
            //     var bigPst = me.getPst( me.ids.big ),
            //         bigCenterX = bigPst.left + bigPst.width/2,  // big图片中心点X坐标,big图片以此为旋转中心点
            //         bigCenterY = bigPst.top + bigPst.height/2;  // big图片中心点Y坐标,big图片以此为旋转中心点
            //     for ( var id in me.conf.tinys ) {
            //         var tinyPst = me.getPst( me.records[id] ),
            //             x0 = tinyPst.left + tinyPst.width/2,    // tinyDiv中心点的偏移left
            //             y0 = tinyPst.top + tinyPst.height/2;    // tinyDiv中心点的偏移top
            //         var newPoint = me.calcPointPstWhenRotate( x0, y0, bigCenterX, bigCenterY, oldDeg, newDeg );
            //         newPoint.left -= tinyPst.width/2;   // 恢复为中心点不变的偏移
            //         newPoint.top -= tinyPst.height/2;   // 恢复为中心点不变的偏移
            //         // $('#'+id).css( {left: newPoint.x, top: newPoint.y} );
            //         // console.log('修正旋转的相关参数',bigPst, bigCenterX, bigCenterY, tinyPst, newPoint);
            //         $('#'+id).css( _f.addpx(newPoint) );
            //         me.storeInfo( id, _f.addpx(newPoint) );
            //     }
            // });
        },
        // 旋转一个元素。oldRotateDeg:现在的旋转角度 isClockwise:是否顺时针旋转
        rotateOne: function( id, newRotateDeg, cb ){
            var me = this, 
                rp = "rotate(" + newRotateDeg + "deg)";
            // css前缀-ms-：IE9, -webkit-:Safari和chrome
            $('#'+id).css( {transform:rp, "-ms-transform":rp, "-webkit-transform":rp, "-o-transform":rp, "-moz-transform":rp} );
            if ( typeof cb==='function' ) { cb(); }
        },
        // 旋转所有元素 isClockwise:是否顺时针旋转（未传值是逆时针旋转）
        rotateAll: function( isClockwise, cb ){
            var me = this,
                oldDeg = me.conf.rotateAngle,   // 旋转前的角度
                newDeg = me.getRotateDeg( oldDeg, isClockwise );    // 旋转后的角度
            me.conf.rotateAngle = newDeg;
            // 旋转big(以big的中心点旋转)
            me.rotateOne( me.ids.big, newDeg, function(){   
                // todo:可使用getTinyDivNewPstWhenBigDivRotate函数替换
                // 修正tinyDiv的位置，使其中心点相对于旋转后的bigDiv位置不变
                var bigPst = me.getPst( me.ids.big ),
                    bigCenterX = bigPst.left + bigPst.width/2,  // big图片中心点X坐标,big图片以此为旋转中心点
                    bigCenterY = bigPst.top + bigPst.height/2;  // big图片中心点Y坐标,big图片以此为旋转中心点
                for ( var id in me.conf.tinys ) {
                    var tinyPst = me.getPst( me.records[id] ),
                        x0 = tinyPst.left + tinyPst.width/2,    // tinyDiv中心点的偏移left
                        y0 = tinyPst.top + tinyPst.height/2;    // tinyDiv中心点的偏移top
                    var newPoint = me.calcPointPstWhenRotate( x0, y0, bigCenterX, bigCenterY, oldDeg, newDeg );
                    newPoint.left -= tinyPst.width/2;   // 恢复为中心点不变的偏移
                    newPoint.top -= tinyPst.height/2;   // 恢复为中心点不变的偏移
                    // $('#'+id).css( {left: newPoint.x, top: newPoint.y} );
                    // console.log('修正旋转的相关参数',bigPst, bigCenterX, bigCenterY, tinyPst, newPoint);
                    $('#'+id).css( _f.addpx(newPoint) );
                    me.storeInfo( id, _f.addpx(newPoint) );
                }
            });
        },
        
        // 放大缩小一个元素 isZoomIn:是否放大。 centerPst:缩放中心点位置
        zoomOne: function( event, id, isZoomIn, centerPst, cb ){
            var me = this, zoomInfo,
                $el = $( '#'+id ),
                idPst = me.getPst( me.records[id] );    // 缩放时位置从存储对象中获得位置，这样精度更高，防止误差累计
                // if ( isCursorCenter ){
                //     cursorPst = _f.getCursorPosition(event, $('#'+me.ids.out)[0]),  // 鼠标在out中的偏移位置{left:xx, top:xx}
                //     zoomInfo = me.calcNewPstWhenZoom( idPst, isZoomIn, cursorPst ); // 以鼠标为中心点缩放      
                // } else {
                //     zoomInfo = me.calcNewPstWhenZoom( idPst, isZoomIn );         // 以元素中心点缩放
                // }
                zoomInfo = me.calcNewPstWhenZoom( idPst, isZoomIn, centerPst );
            $el.css( me.getPst(zoomInfo, true) );
            if (typeof cb === 'function'){ cb( zoomInfo, event, id, isZoomIn, centerPst ); }
        },
        // 放大缩小所有的元素。第一个参数说明放大还是缩小（zoomOut缩小，zoomIn放大）
        zoomAll: function( event, isZoomIn , cb ){
            var me = this,
                newscale = me.conf.scale, 
                cursorPst,  // 鼠标在out中的偏移位置{left:xx, top:xx}
                ids = Object.keys( me.records );
                // args = [].slice.call( arguments, 1 );   // 将第二个及以后的参数转化为数组
            console.log('所有的id', ids);
            // 缩放每一个元素。所有元素相对于光标位置缩放
            cursorPst = _f.getCursorPosition( event, $('#'+me.ids.out)[0] );
            for ( var i=0, len=ids.length; i<len; i++ ) {
                if ( ids[i] === me.ids.big ) {
                    // 缩放big图片
                    me.zoomOne( event, ids[i], isZoomIn, cursorPst, function( zoomInfo ){
                        me.storeInfo( ids[i], me.getPst(zoomInfo) );
                        newscale = newscale * zoomInfo.scaleZoom;
                    });
                } else if ( me.conf.tinys[ ids[i] ] ){
                    // 缩放tinyDiv图片
                    me.zoomOne( event, ids[i], isZoomIn, cursorPst, function( zoomInfo ){
                        me.storeInfo( ids[i], me.getPst(zoomInfo) );
                    });
                } else if ( ids[i] === me.ids.out ){
                    continue;
                }
            }
            // console.log('变化的scale:', me.conf.scale, newscale );
            me.conf.scale = newscale;
        },
        // 计算div放大缩小后的位置信息。 divPst = {left:xx, top:xx, width:xx, height:xx}
        // isZoomIn: 是否放大。true:放大; centerPst:光标的位置{left:xx, top:xx}。有值时以光标点缩放，没有值时以div中心点缩放
        // 应该再设置centerPst可以为百分比，也可以为px值。如果为百分比则换算为px值再计算
        // centerPst与divPst拥有相同的参考父对象。其值若为百分比，应该是相对于div的百分比。若为像素，则应该是相对于共同的参考父对象。
        calcNewPstWhenZoom: function( divPst, isZoomIn, centerPst ){
            var level = 1.25, 
                zoom = isZoomIn ? level : 1 / level,  // 缩放比例（zoomIn放大，zoomOut缩小）
                // zoom = isZoomIn ? 1.1 : 0.9,  // 缩放比例（zoomIn放大，zoomOut缩小）
                obj = {};
            obj.scaleZoom = zoom; 
            obj.width = divPst.width * zoom;    // div缩放后的宽度
            obj.height = divPst.height * zoom;  // div缩放后的高度
            if ( centerPst ) {
                // 以光标点为中心缩放
                var ratioX = ( centerPst.left - divPst.left ) / divPst.width,   // 光标在图中横坐标的比例
                    ratioY = ( centerPst.top - divPst.top ) / divPst.height;    // 光标在图中纵坐标的比例
                    obj.left = centerPst.left - obj.width * ratioX;
                    obj.top = centerPst.top - obj.height * ratioY;
            } else {
                // 以div中心点为中心缩放
                obj.left = divPst.left + ( divPst.width * 0.5 - divPst.width * zoom * 0.5 ); // left + 缩放后的偏移
                obj.top = divPst.top + ( divPst.height * 0.5 - divPst.height * zoom * 0.5 ); // top + 缩放后的偏移
            }
            return obj;
        },
        // 修改有背景图片的div的缩放比例
        modifyScale: function( id, setScale ){
            var me = this,
                $el = $( '#'+id ),
                // backgroundImage的返回值是这样的：url("base64")，故要截取，只保留图片的base64
                imgsrc = $el.css('backgroundImage').slice(5,-2);
            _f.getImgRealSize( imgsrc, function( realWidth, realHeight ){
                var nowWidth = realWidth * setScale,
                    nowHeight = realHeight * setScale;
                $el.css( { width: nowWidth, height: nowHeight } );
            });
        },
        // 重置某id的宽高。
        // scale:缩放比例(可不传) ids: 要重置的id,数组或字符串(可不传，此时重置big和所有tiny的宽高)。
        resizeWidthAndHeight: function(scale, ids){
            var me = this;
            scale = scale ? scale : me.conf.scale;  // 缩放比例
            ids = ids ? ids : Object.keys(me.original);     // 要重置宽高的id,数组或字符串
            if ( typeof ids === 'string' ) {
                var originalStyle = me.original[ids];       // img或div的原始宽高
                var newStyle = {width: originalStyle.width * scale, height: originalStyle.height * scale};
                $('#'+ids).css( _f.addpx(newStyle) );
                me.storeInfo(ids, newStyle);
            } else if ( typeof ids === 'object' ) {
                for (var i in ids) {
                    var originalStyle = me.original[ ids[i] ];    // img或div的原始宽高
                    var newStyle = {width: originalStyle.width * scale, height: originalStyle.height * scale};
                    $('#'+ids[i]).css( _f.addpx(newStyle) );
                    me.storeInfo(ids[i], newStyle);
                }
            }
        },
        // 计算某图片在div中初始化时的宽高、偏移及缩放比例。要求div能最大限度完全显示图片
        calcInitPstAndScale: function( divWidth, divHeight, imgWidth, imgHeight ){
            var me = this, imgInfo = {} ; 
            if ( imgWidth < divWidth && imgHeight < divHeight ) {
                // 图片比div框小：图片大小不变，居中显示
                imgInfo.scale = 1;
                imgInfo.width = imgWidth;
                imgInfo.height = imgHeight;
                imgInfo.left = ( divWidth - imgWidth ) / 2;
                imgInfo.top = ( divHeight - imgHeight ) / 2 ;
            } else {
                // 图片比div框大：‘图片宽高比例’ >= ‘div宽高比例’，则以div宽为标准缩放，反之以div高为标准缩放。
                if ( imgWidth/imgHeight >= divWidth/divHeight ) {   // 以宽为标准缩放
                    imgInfo.scale = divWidth / imgWidth;
                    imgInfo.width = divWidth;
                    imgInfo.height = imgHeight * imgInfo.scale;
                    imgInfo.left = 0;
                    imgInfo.top = ( divHeight - imgInfo.height ) / 2 ;
                } else {    // 以高为标准缩放
                    imgInfo.scale = divHeight / imgHeight;
                    imgInfo.width = imgWidth * imgInfo.scale;
                    imgInfo.height = divHeight;
                    imgInfo.left = ( divWidth - imgInfo.width ) / 2;
                    imgInfo.top = 0 ;
                }
            }
            return imgInfo;
        },
        // // 调整一些特性.feature:特性(必输，如'scaleable')， isTrue:是否为true
        // adjust: function(feature, isTrue){
        //     if (typeof this.conf[feature] === 'boolean') {
        //         if (arguments.length === 1) {
        //             return this.conf[feature];
        //         } else if (arguments.length === 2) {
        //             this.conf[feature] = isTrue;
        //         }
        //     }
        //     return this;
        // },
        // 设置(2个参数)和判断（1个参数）某元素是否可移动
        canMove:function(id, state){
            var me = this;
            if (!me.records[id]) { return me; }
            // 有一个id参数,获取该元素是否可移动状态
            if (arguments.length === 1) {
                return  me.conf.disableMoveId[id] ? false : true;
            // 有两个参数，设置该元素是否可移动状态
            } else if (arguments.length === 2) {
                state ? delete me.conf.disableMoveId[id] : me.conf.disableMoveId[id] = true;
                return me;
            }
        },
        // 设置(2个参数)和判断（1个参数）某元素是否可选中
        canSelect: function(id, state){
            var me = this;
            if (!me.records[id]) { return me; }
            // 有一个id参数,获取该元素是否可选中状态
            if (arguments.length === 1) {
                return  me.conf.disableSelectId[id] ? false : true;
            // 有两个参数，设置该元素是否可选中状态
            } else if (arguments.length === 2) {
                state ? delete me.conf.disableSelectId[id] : me.conf.disableSelectId[id] = true;
                return me;
            }
        },
        // 开启拖拽生成tinyDiv。 divId:开启拖拽功能的div容器
        openDrawTinyDiv: function( divId ){
            var me = this;
            $('#'+divId).addClass('canDrawTinyDiv');
        },
        // 关闭拖拽生成tinyDiv。 divId:开启拖拽功能的div容器
        closeDrawTinyDiv: function( divId ){
            var me = this;
            $('#'+divId).removeClass('canDrawTinyDiv');
        },
        // 检查某div是否开启拖拽生成tinyDiv
        checkDrawTinyDivState: function( divId ){
            return  $('#'+divId)[0].className.indexOf('canDrawTinyDiv') > -1;
        },
        // 添加一个tinyDiv。带单位。 mycss格式：{ left:xx, top:xx, width:xx, height:xx } hasDel:右上角是否有删除标志
        addTiny: function( mycss, hasDel ){
            var me = this,
                $delBtn, $tiny, $tinyImg,
                bigPst = me.getPst( me.ids.big ),
                bigCenterX = ( bigPst.left + bigPst.width / 2 ) + 'px',
                bigCenterY = ( bigPst.top + bigPst.height / 2 ) + 'px',
                tinyId = _f.generateGUID(),
                defcss = { position:'absolute', left:bigCenterX, top:bigCenterY, outline:'1px dashed #f00', 
                            width: me.conf.defTinyWidth, height: me.conf.defTinyHeight, zIndex: me.conf.zIndex++ },
                tinycss = $.extend(true, {}, defcss, mycss),
                tinyImgCss = {width:'100%', height:'100%', margin:0, padding:0};
                delcss = { position:"absolute", left: "100%", top: "-20px", cursor:"pointer", color:"#f00", "user-select":"none"},
                innerStr = me.conf.pattern === 'img' ? '<img id="' + tinyIdImg + '" class="mdraggable" src="" draggable="false"> <div>X</div>' : '<div>X</div>';
                tinyStr = '<div id="' + tinyId + '" class="mdraggable">' + innerStr + '</div>';
            $tiny = $( tinyStr );
            $delBtn = $tiny.find('div');
            $tiny.css( tinycss );
            $delBtn.css( delcss );
            $( '#'+me.ids.out ).append( $tiny );
            if (me.conf.pattern === 'img') {
                $tinyImg = $tiny.find('img');
                $tinyImg.css(tinyImgCss);
            }
            // 给删除按钮绑定事件
            $delBtn.on('click', function(){
                me.delTiny( tinyId );
                $delBtn.remove();
            });
            me.storeInfo( tinyId, tinycss );    // 存储tinyDiv的信息
            return tinyId;
        },
        // 添加一个简单的tiny
        addSimpleTiny: function(mycss){
            var me = this,
                bigPst = me.getPst(me.ids.big),
                bigCenterX = (bigPst.left + bigPst.width / 2) + 'px',
                bigCenterY = (bigPst.top + bigPst.height / 2) + 'px',
                $tiny,
                tinyId = _f.generateGUID(),
                tinycss = { position:'absolute', left:bigCenterX, top:bigCenterY, display:'block', zIndex: me.conf.zIndex++,
                            padding:0, margin:0, width: me.conf.defTinyWidth, height: me.conf.defTinyHeight },
                tinyStr = me.conf.pattern === 'img' ? '<img id="' + tinyId + '" class="mdraggable" src="" draggable="false">' :
                                                        '<div id="' + tinyId + '" class="mdraggable"></div>';
            $.extend(true, tinycss, mycss);
            $tiny = $(tinyStr);
            $tiny.css(tinycss);
            $('#'+me.ids.out).append($tiny);
            // 给添加的tiny添加选中方法
            $tiny[0].addEventListener('click', function(event){
                if (!me.canSelect(tinyId)) { return; }  // 配置成不能选中该tiny，直接返回
                var selectedTiny = me.getSelectedTiny();
                $('#'+selectedTiny[0]).css({outline: 'none'});
                me.selectedTiny = [tinyId];    // 目前只让选中一个tiny
                $tiny.css({outline:'1px dashed #f00'});
            });
            me.storeInfo(tinyId, tinycss);
            return tinyId;
        },
        // 删除一个tinyDiv。id:要删除的tinyDiv的id值
        delTiny: function( id ){
            var me = this, out, tiny;
            if ( me.conf.tinys[ id ] ) {
                out = document.getElementById( me.ids.out );
                tiny = document.getElementById( id );
                out.removeChild( tiny );
                delete me.original[id];
                delete me.records[id];
                delete me.conf.tinys[id];
            }
        },
        // 删除所有的tinyDiv。
        clearTinys: function(){
            var me = this;
            for (var id in me.conf.tinys) {
                me.delTiny( id );       
            }
        },
        // 获取方位left,top,width,height对象。obj：id值，元素对象或普通对象.hasPx:true有单位
        getPst: function( obj, hasPx ){
            var pst = {}, $el;
            if ( typeof obj === 'string' ) {
                // obj是元素的id
                // 通过元素查询获取方位用于计算。无论设置的是什么，$(xx).css获取的值单位都是px
                $el = $('#'+obj);
                pst = { left: $el.css('left'), top: $el.css('top'), width: $el.css('width'), height: $el.css('height') };
            } else if ( typeof obj === 'object' ) {
                if ( obj instanceof jQuery || obj instanceof HTMLElement ) {
                    // obj是jquery对象或者是dom对象
                    $el = $( obj );
                    pst = { left: $el.css('left'), top: $el.css('top'), width: $el.css('width'), height: $el.css('height') };
                } else {
                    // obj是普通对象
                    pst = { left: obj.left, top: obj.top, width: obj.width, height: obj.height };
                }
            }
            return  hasPx ? _f.addpx(pst) : _f.rmpx(pst);;
        },
        setPstAndSave: function(){

        },

        // 设置tiny的坐标并保存。 tiny:tiny的id(字符串)或序号(number) x,y:tiny相对于big的偏移（未缩放）
        // todo：不知道有直接设置tiny位置的函数不
        setTinyPstAboutBig: function(tiny, x, y){
            var me = this, 
                lt = {},    // tiny的左上角坐标(相对于out)
                tinyId = typeof tiny === 'number' ? Object.keys(me.conf.tinys)[tiny] : tiny;
            if ( !me.conf.tinys[tinyId] ) { console.warn('tiny的id不正确'); return false; }
            var bigPst = me.getPst(me.ids.big),                                 // big未旋转的缩放位置（相对于out）
                rBigPst = me.calcBigRange(bigPst, me.conf.rotateAngle);         // big旋转后的缩放位置（相对于out）
            lt.left = rBigPst.left + x * me.conf.scale;     // tiny的左缩放偏移
            lt.top = rBigPst.top + y * me.conf.scale;       // tiny的上缩放偏移
            $('#'+tinyId).css( _f.addpx(lt) );
            me.storeInfo(tinyId, lt);       // 保存
        },
        // 获取某个点point1与另一个点point2的距离
        getPointAboutPoint: function(point1, point2){

        },
        // 获取当big旋转后，tiny的新位置.可用来修正tinyDiv的位置，使其中心点相对于旋转后的bigDiv位置不变
        // tinyPst:tinyDiv的位置参数。 bigPst:bigDiv的位置参数， oldDeg：旧的旋转角度 newDeg:新的旋转角度
        // 返回tinyPst新的位置，使其中心点相对于旋转后的bigDiv位置不变
        getTinyDivNewPstWhenBigDivRotate: function(tinyPst, bigPst, oldDeg, newDeg){
            // 修正tinyDiv的位置，使其中心点相对于旋转后的bigDiv位置不变
            var bigCenterX = bigPst.left + bigPst.width/2,      // big图片中心点X坐标,big图片以此为旋转中心点
                bigCenterY = bigPst.top + bigPst.height/2,      // big图片中心点Y坐标,big图片以此为旋转中心点
                tinyCenterX = tinyPst.left + tinyPst.width/2,   // tiny图片中心点X坐标
                tinyCenterY = tinyPst.top + tinyPst.height/2;   // tiny图片中心点Y坐标
            var newPoint = this.calcPointPstWhenRotate( tinyCenterX, tinyCenterY, bigCenterX, bigCenterY, oldDeg, newDeg ); 
            newPoint.left -= tinyPst.width/2;   // 恢复为中心点不变的偏移
            newPoint.top -= tinyPst.height/2;   // 恢复为中心点不变的偏移
            return newPoint;
        },
        // 获取当前旋转角度下，tiny相对于big的偏移。 isOrigin：是否换算成缩放前的偏移和位置 
        // tiny:tiny的id或序号,不存在就返回所有的偏移
        // refPointer:偏移参考点,相对于当前旋转角度下的big左上角now_lt 和 相当于旋转前big左上角的ori_lt
        getTinyPstAboutBig: function(tiny, isOrigin, refPoint){
            var me = this,
                scale = me.conf.scale,
                angle = me.conf.rotateAngle,
                refPoint = refPoint ? refPoint : 'now_lt';    // 默认为当前旋转角度下（旋转后）的左上角 
            // todo:写一个根据序号返回tinyId或对象的函数
            var tinyId = typeof tiny === 'number' ? Object.keys(me.conf.tinys)[tiny] : 
                            typeof tiny === 'string' ? tiny : '';
            var result = {},
                bigPst = me.getPst( me.readInfo(me.ids.big) ),              // big未旋转时的缩放位置
                rBigPst = me.calcBigRange(bigPst, me.conf.rotateAngle);     // big旋转后的缩放位置（相对于out）
            // 查询某一个tiny的偏移
            if (tinyId) {
                var rTinyPst = me.getPst( me.readInfo(tinyId) );            // big旋转后，tiny的缩放位置（相对于out）
                var tinyPst = me.getTinyDivNewPstWhenBigDivRotate(rTinyPst, bigPst, angle, 1); // big旋转前，tiny的缩放位置（相对于out）
                if (refPoint === 'now_lt'){
                    result.x = isOrigin ? (rTinyPst.left - rBigPst.left) / scale : (rTinyPst.left - rBigPst.left);
                    result.y = isOrigin ? (rTinyPst.top - rBigPst.top) / scale : (rTinyPst.top - rBigPst.top);
                } else if (refPoint === 'ori_lt') {
                    result.x = isOrigin ? (tinyPst.left - bigPst.left) / scale : (tinyPst.left - bigPst.left);
                    result.y = isOrigin ? (tinyPst.top - bigPst.top) / scale : (tinyPst.top - bigPst.top);
                }
                result[tinyId] = {
                    x: result.x,
                    y: result.y
                }
            // 查询所有tiny的偏移
            } else {
                for (var id in me.conf.tinys) {
                    var rTinyPst = me.getPst( me.readInfo(id) );    // tiny旋转后的缩放位置（相对于out）
                    var tinyPst = me.getTinyDivNewPstWhenBigDivRotate(rTinyPst, bigPst, angle, 0); // tiny旋转前的缩放位置（相对于out）
                    if (refPoint === 'now_lt') {
                        result[id] = {
                            x: isOrigin ? (rTinyPst.left - rBigPst.left) / scale : (rTinyPst.left - rBigPst.left),
                            y: isOrigin ? (rTinyPst.top - rBigPst.top) / scale : (rTinyPst.top - rBigPst.top)
                        }
                    } else if (refPoint === 'ori_lt') {
                        result[id] = {
                            x: isOrigin ? (tinyPst.left - bigPst.left) / scale : (tinyPst.left - bigPst.left),
                            y: isOrigin ? (tinyPst.top - bigPst.top) / scale : (tinyPst.top - bigPst.top)
                        }
                    }
                }
            }
            return result;
        },
        // 存储相关信息。如果是tinyDiv，则在额外存一份位置(left,top,width,height)到me.conf.tinys里
        storeInfo: function( id , info ){
            var me = this,
                oldInfo = me.records[id] || ( me.records[id] = {} ),
                newInfo = $.extend( true, oldInfo, info );
            if ( me.ids.out !== id && me.ids.big !== id ) {
                // id是tinyDiv的id。即使info中不包含完left,top,width,height,也不会影响以前的值，因为newInfo做了extend
                me.conf.tinys[ id ] = _f.rmpx( {left:newInfo.left, top:newInfo.top, width:newInfo.width, height:newInfo.height} );
            }
            me.records[id] = newInfo;
        },
        delInfo: function( id ){
            if ( this.ids.out !== id || this.ids.big !== id ) {
                delete this.conf.tinys[ id ];
            }
            delete this.records[id];
        },
        // isPst：是否读取方位
        readInfo: function( id, isPst ){
            return isPst ? this.conf.tinys[ id ] : this.records[ id ];
        },
        // 计算某个旋转角度时div的边界范围。
        // divPst:未旋转时(旋转0度)div的位置{left:xx, top:xx, width:xx, top:xx};  rotateAngle: 旋转角度
        calcBigRange: function( divPst, rotateAngle ){
            // 如果未旋转，直接返回
            if (rotateAngle === 0 || rotateAngle % 360 === 0) { return divPst; }

            var me = this,
                newDivPst = {},
                bigPst = me.getPst( me.ids.big ),   // bigDiv的位置
                bigCenterX = bigPst.left + bigPst.width/2,  // bigDiv的中心点X
                bigCenterY = bigPst.top + bigPst.height/2,  // bigDiv的中心点Y
                // 未旋转前div左下角(lb)的坐标
                lbX0 = divPst.left, 
                lbY0 = divPst.top + divPst.height, 
                // 未旋转前div右上角(rt)的坐标 
                rtX0 = divPst.left + divPst.width,  
                rtY0 = divPst.top,   
                // 未旋转前div‘左下角的点’和‘右上角的点’旋转rotateAngle角度后的位置{left:xx, top:xx}
                lbRotate = me.calcPointPstWhenRotate( lbX0, lbY0, bigCenterX, bigCenterY, 0, rotateAngle ),
                rtRotate = me.calcPointPstWhenRotate( rtX0, rtY0, bigCenterX, bigCenterY, 0, rotateAngle );
                // console.log('calcBigRange:',lbX0,lbY0, rtX0,rtY0, lbRotate, rtRotate);
            newDivPst.left = Math.min( lbRotate.left, rtRotate.left );
            newDivPst.top = Math.min( lbRotate.top, rtRotate.top );
            newDivPst.width = Math.abs( rtRotate.left - lbRotate.left );
            newDivPst.height = Math.abs( rtRotate.top - lbRotate.top );
            return newDivPst;
        },
        // 当tinyDiv越过bigDiv的边界时计算其修正位置，使其始终在bigPst的范围内
        calcTinyRepairPstWhenOverBig: function( tinyPst, bigPst ){
            var me = this,
                newTinyPst = tinyPst,
                newBigPst = me.calcBigRange( bigPst, me.conf.rotateAngle ), // 当前旋转角度下bigDiv的位置
                state = me.checkTinyPstAboutBigDiv( tinyPst, newBigPst );   // 获取tinyDiv相对于当前旋转角度下bigDiv的位置
            if ( !state.inDiv ) {
                // 当tinyDiv拖出big边界时，计算新的tinyDiv的偏移，使其在bigPst范围内
                newTinyPst.left = state.overRight ? newBigPst.left + newBigPst.width - tinyPst.width :
                                        state.overLeft ? newBigPst.left : tinyPst.left;
                newTinyPst.top = state.overBottom ? newBigPst.top + newBigPst.height - tinyPst.height :
                                        state.overTop ? newBigPst.top : tinyPst.top;
            }
            return newTinyPst;
        },
        // 当drawDiv越过bigDiv边界时计算其修正位置，使其始终在bigDiv的范围内
        calcDrawRepairPstWhenOverBig: function( drawPst, bigPst, drawOrigPst ){
            var me = this,
                newDrawPst = drawPst,
                newBigPst = me.calcBigRange( bigPst, me.conf.rotateAngle ), // 当前旋转角度下bigDiv的位置
                state = me.checkTinyPstAboutBigDiv( drawPst, newBigPst );   // 获取drawDiv相对于当前旋转角度下bigDiv的位置
            if ( !state.inDiv ) {
                // 当drawDiv不全在bigDiv内时,修正drawPst的位置，使其始终在bigDiv范围内 
                // 绘制起点到bigDiv的四个边界的最长距离
                var maxWidthRight = Math.abs( newBigPst.left + newBigPst.width - drawOrigPst.left ),
                    maxWidthLeft = Math.abs( newBigPst.left - drawOrigPst.left ),
                    maxHeightTop = Math.abs( newBigPst.top - drawOrigPst.top ),
                    maxHeightBottom = Math.abs( newBigPst.top + newBigPst.height - drawOrigPst.top );
                newDrawPst.left = state.overLeft ? newBigPst.left : drawPst.left;
                newDrawPst.top = state.overTop ? newBigPst.top : drawPst.top;
                newDrawPst.width = state.overLeft ? maxWidthLeft : 
                                        state.overRight ? maxWidthRight : drawPst.width;
                newDrawPst.height = state.overTop ? maxHeightTop : 
                                        state.overBottom ? maxHeightBottom : drawPst.height;
            }
            return newDrawPst;
        },
        // 判断一个点相对于大Div的位置。返回[在div中?, 位于div的左边?， 位于div的右边?, 位于div的上边?, 位于div的下边?]
        // pleft,ptop:点的left和top偏移, bigPst:大div的位置{left:xx, top:xx, width:xx, height:xx}
        checkPointPstaboutBigDiv: function( pleft, ptop, bigPst ) {
            var state = {
                overLeft: pleft < bigPst.left,
                overRight: pleft > bigPst.left + bigPst.width,
                overTop: ptop < bigPst.top,
                overBottom: ptop > bigPst.top + bigPst.height,
            }
            state.inDiv = !overLeft && !overRight && !overTop && !overBottom;
            return state;
        },
        // 判断一个小Div相对于大div的位置。tinyPst:小div的位置，bigPst:大div的位置
        checkTinyPstAboutBigDiv: function( tinyPst, bigPst ) {
            var state = {
                overLeft: tinyPst.left < bigPst.left,  // tinyDiv左边界小于bigDiv左边界
                overRight: tinyPst.left + tinyPst.width > bigPst.left + bigPst.width,  // tinyDiv右边界大于bigDiv右边界
                overTop: tinyPst.top < bigPst.top, // tinyDiv上边界小于bigDiv上边界
                overBottom: tinyPst.top + tinyPst.height > bigPst.top + bigPst.height // tinyDiv下边界大于bigDiv下边界
            };
            state.inDiv = !state.overLeft && !state.overRight && !state.overTop && !state.overBottom;   // tinyDiv是否全部在bigDiv内
            return state;
        },
        // 以out为左上角为原点，相对于big中心点旋转到newAngle后的点坐标


        // 绑定事件:旋转,拖动,拖动选框
        bindEvents: function(){
            var me = this,
                oldX = 0, oldY = 0, // 鼠标在视口的初始位置
                diffX = 0, diffY = 0,   // 光标到元素的偏移
                drawDivId,         
                drawOrigPst = null, // 拖动绘制tinyDiv时，起始光标到out边界的偏移
                isDrawTiny = false, // 是否处于绘制tinyDiv状态中
                isMoveAll = false, 
                isMoveTiny = false;
            // 拖动时触发的自定义事件
            DragDrop.addHandler('dragstart', function(event){
                // console.log('dragstart触发', event);
                var target = event.target;
                diffX = event.diffX;
                diffY = event.diffY;
                oldX = event.x;
                oldY = event.y;
                if ( target.className.indexOf('canDrawTinyDiv') > -1 ) {
                    // 手绘tinyDiv开始
                    isDrawTiny = true;
                    drawOrigPst = _f.getCursorPosition( event.origEvent, $('#'+me.ids.out)[0] );  // 光标到out边界的偏移
                    var bigPst = me.getPst( me.ids.big ),   // bigDiv的位置
                        bigCenterX = bigPst.left + bigPst.width/2,  // bigDiv的中心点X
                        bigCenterY = bigPst.top + bigPst.height/2;  // bigDiv的中心点Y
                    // 手绘起点旋转后的点坐标
                    drawOrigPst = me.calcPointPstWhenRotate( drawOrigPst.left, drawOrigPst.top, bigCenterX, bigCenterY, 0, me.conf.rotateAngle );
                    var drawPst = {width:0, height:0, left: drawOrigPst.left, top: drawOrigPst.top};
                    drawDivId = me.addTiny( _f.addpx(drawPst) );
                    me.storeInfo( drawDivId, _f.addpx(drawPst) );
                } else {
                    // 拖动div开始
                    if ( target.id === me.ids.big ) {
                        // 如果拖动big
                        if ( me.canMove(me.ids.big) ) {
                            isMoveAll = true;
                        }
                    } else if ( me.conf.tinys[ target.id ] ) {
                        // 如果拖动tinyDiv
                        // 配置成 能选中 且 能拖动 才能拖动该tiny
                        if (me.canSelect(target.id) && me.canMove(target.id) ) {
                            isMoveTiny = true;    
                        }
                    }
                }
            });
            DragDrop.addHandler('drag', function(event){
                // console.log('drag触发', event);
                var target = event.target;
                if ( isDrawTiny ) {
                    var drawPst = me.getPst( me.records[ drawDivId ] ),
                        bigPst = me.getPst( me.records[ me.ids.big ] ),
                        width = event.x - oldX,     // 现在鼠标的位置 - 起点鼠标的位置
                        height = event.y - oldY;
                    // 计算drawDiv的宽高及位置。如果拖动使边界小于起始边界(width<0和height<0)，则更新起始边界
                    drawPst.left = width < 0 ? drawOrigPst.left + width : drawOrigPst.left; // 不要用drawPst.left,会引起累计误差
                    drawPst.top = height < 0 ? drawOrigPst.top + height : drawOrigPst.top;
                    drawPst.width = Math.abs( width );  
                    drawPst.height = Math.abs( height );
                    // 如果只允许drawDiv在bigDiv范围内，则鼠标超出bigDiv的边界时修正drawDiv的宽高及位置
                    if ( !me.conf.allowDrawOutBig ) {
                        drawPst = me.calcDrawRepairPstWhenOverBig( drawPst, bigPst, drawOrigPst );
                    }
                    $("#" + drawDivId).css( _f.addpx( drawPst ) );
                    me.storeInfo( drawDivId, _f.addpx( drawPst ) );
                } else if ( isMoveAll ) {
                    // 如果拖动big,则所有的tinyDiv也跟着big一起拖动，改变位置
                    // 改变bigDiv的位置
                    var bigPst = _f.addpx( {left: event.x-diffX, top: event.y-diffY} );
                    $('#'+ me.ids.big).css( bigPst );
                    me.storeInfo( me.ids.big, bigPst );
                    // 改变所有tinyDiv的位置
                    for ( var id in me.conf.tinys ) {
                        var tinyPst = me.getPst( me.records[ id ] );
                        tinyPst.left += event.x - oldX;     // left + x向偏移
                        tinyPst.top  += event.y -oldY;      // top + y向偏移
                        $('#'+id).css( _f.addpx(tinyPst) );
                        me.storeInfo( id, _f.addpx(tinyPst) );
                    }
                    oldX = event.x;
                    oldY = event.y;
                } else if ( isMoveTiny ) {
                    // 如果拖动tinyDiv，则只改变拖动tinyDiv的位置
                    var tinyPst = me.getPst( target.id );
                        bigPst = me.getPst( me.records[ me.ids.big ] );
                    tinyPst.left = event.x - diffX;
                    tinyPst.top = event.y - diffY;
                    // 如果只允许在bigDiv范围内拖动tinyDiv，则当拖动超出bigDiv边界时修正tinyPst的位置
                    if ( !me.conf.allowMoveOutBig ) {
                        tinyPst = me.calcTinyRepairPstWhenOverBig(tinyPst, bigPst);
                    }
                    $( target ).css( _f.addpx(tinyPst) );
                    me.storeInfo( target.id, _f.addpx(tinyPst) );
                }
            });
            DragDrop.addHandler('dragend', function(event){
                // console.log('dragend触发', event);
                var target = event.target;
                // 修正tinyDiv的位置
                if ( isDrawTiny ) {

                } else if ( isMoveAll ) {

                } else if ( isMoveTiny ) {
                    me.conf.dragendFn();        // 设置的dragend触发函数
                    // 如果只允许在bigDiv范围内拖动tinyDiv，则当拖动超出bigDiv边界时修正tinyPst的位置
                    if ( !me.conf.allowMoveOutBig ) {
                        var tinyPst = me.getPst( target.id ),
                            bigPst = me.getPst( me.records[ me.ids.big ] ),
                            newTinyPst = _f.addpx( me.calcTinyRepairPstWhenOverBig(tinyPst, bigPst) );
                        $( target ).css( newTinyPst );
                        me.storeInfo( target.id, newTinyPst );
                    }
                }
                oldX = oldY = 0;
                isMoveAll = isMoveTiny = isDrawTiny = false;
            });
            // 放大缩小功能
            $( '#' + me.ids.out )[0].addEventListener('mousewheel', function(event){
                if (!me.conf.scaleable) { return; }
                event = event || window.event;
                var target = event.target || event.srcElement,
                    // 获取滚轮值。向前滚是120的倍数，向后滚是-120的倍数。忽略opera9.5版本以前的浏览器。
                    // firefox滚轮信息保存在detail属性中，且向前滚值是-3，向后滚值是3。
                    wheelDelta =  event.wheelDelta || -event.detail*40,
                    isZoomIn = wheelDelta > 0 ? true : false;   // 向前滚放大，向后滚缩小
                me.zoomAll( event, isZoomIn );
                event.preventDefault();     // 阻止默认滚轮事件，防止有滚动条时缩放同时上下滚动页面
            });
        }
    });

    // 暴露FixIco
    window.FixIco = FixIco;
})(window, document, jQuery);