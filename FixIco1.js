;(function(window, document, $, undefined){
    // 发布订阅模式
    function Event (){
        var list = {},      // 存储事件名及方法{ key1:[fn1,fn2,...], key2:[...] }
            oncelist = {},  // 存储once事件名及方法{ key1:[fn1,fn2,...], key2:[...] }
            offline = {},   // 存储离线事件及相关参数.先发布后订阅用 { key1: [args1, args2,...], key2: [...] }
            _doOffline, _listen, _trigger, _remove, once, listen, trigger, remove;

        _doOffline = function(key, fn){
            // 先发布后订阅的情形，直接执行订阅的事件方法，并随后清空相关的事件及参数（即只能执行一次）
            for (var i=0, len=offline[key].length; i<len; i++) {
                var args = offline[key][i];
                fn.apply( this, args );     // apply的第二个参数为数组或类数组对象
            }
            offline[key] = null;            // 只能执行一次
        };
        _listen = function(cache, key, fn){
            if ( !cache[key] ) { cache[key] = []; }
            cache[key].push(fn);
        };
        // 注册事件方法。key: {String} 事件名， fn：{function} 处理事件函数
        listen = function(key, fn){
            if ( offline[key] ) {
                // 是先发布后订阅的情形
                _doOffline.call(this, key, fn);
            }
            _listen(list, key, fn); // 无论先发布再订阅，还是先订阅再发布，都要将事件方法添加到列表
        };
        // 注册单次事件方法 key: {String} 事件名， fn：{function} 处理事件函数
        once = function(key, fn){
            if ( offline[key] ) {
                // 是先发布后订阅的情形，此时不将事件方法加入列表
                _doOffline.call(this, key, fn);
            } else {
                // 是先订阅后发布的情形
                _listen(oncelist, key, fn);
            }
        };
        _trigger = function(){
            var cache = Array.prototype.shift.call(arguments),  // 存储对象
                key = Array.prototype.shift.call(arguments),    // 事件名
                args = arguments,                               // 方法参数
                fns = cache[key];                               // 方法数组
            for (var i=0, fn; fn=fns[i]; i++) {
                fn.apply(this, args);
            }
        };
        // 触发事件方法。第一个参数是事件名(string)，以后的参数是处理事件函数的参数
        trigger = function(){
            var key =  Array.prototype.shift.call(arguments),       // 事件名
                arrArgs = Array.prototype.slice.call(arguments);    // 方法参数数组。将arguments对象转换成真正的数组
            if ( !list[key] && !oncelist[key] ) {
                // 如果没有订阅事件，就缓冲事件名及参数，等订阅时再执行方法。即实现先发布后订阅
                if ( !offline[key] ) { offline[key] = []; }
                offline[key].push(arrArgs);
            } else {
                // 如果有订阅事件，就执行订阅事件。即先订阅后发布
                if ( list[key] && list[key].length > 0 ) {          // 该事件注册的是多次监听器
                    _trigger.apply( this, [list, key].concat(arrArgs) );
                }
                if ( oncelist[key] && oncelist[key].length > 0 ) {  // 该事件注册的是单次监听器
                    _trigger.apply( this, [oncelist, key].concat(arrArgs) );
                    oncelist[key].length = 0;
                }
            }
        };
        _remove = function(cache, key, fn){
            var fns = cache[key];
            if (!fns) { return false; }
            if (!fn) {
                // 如果没有传方法，清空所有订阅的方法
                // 因为对象引用是地址。如果直接给fns赋一个新值会使fns指向一个新地址，而不会影响到原来的cache对象。
                // 故只有修改fns的元素才能使其作用到cache。所以使用fns.length=0和fns.splice(),而不直接用fns=[]来置空cache[key]
                fns && (fns.length = 0);    
            } else {
                // 传了方法，清除指定订阅方法
                for (var l=fns.length-1; l>=0; l--) {
                    var _fn = fns[l];
                    if (_fn === fn) { fns.splice(l, 1); }
                }
            }
        };
        // 移除事件方法。key: {String} 事件名， fn：{function} 处理事件函数,没有传则移除所有事件方法
        remove = function(key, fn){
            if ( list[key] && list[key].length>0 ) { _remove(list, key, fn); }
            if ( oncelist[key] && oncelist[key].length>0 ) { _remove(oncelist, key, fn); }
        };
        return {
            emit: trigger,
            trigger: trigger,
            once: once,
            on: listen,
            addListener: listen,
            removeListener: remove,
        }
    }
    /**
     * 获取元素基于document的偏移。即元素到页面左上角的偏移(left,top)
     * @param {Element} element 目标元素对象.
     * @returns {Object} The offset data.
     */
    function getOffset(element) {
        // 1.window.pageXOffset 和 window.pageYOffset 属性设置或返回文档在窗口左上角水平和垂直方向滚动的像素。IE9+支持
        //   在IE8及更早版本可使用 document.documentElement.scrollLeft 和 document.documentElement.scrollTop属性
        // 2.element.clientLeft:表示一个元素的左边框的宽度(px)。不包括左外边距和左内边距。只读。如果有左垂直滚动条，则包括滚动条的宽度
        //   element.clientTop:一个元素顶部边框的宽度（以像素px表示）。不包括顶部外边距或内边距。只读
        // 3.element.getBoundingClientRect()返回元素的大小和它相对于视窗的位置。{left:xx, right:xx, top:xx, bottom:xx, width:xx, height},
        //   width,height:元素的宽度和高度, left,right:元素左边/右边相对于视口左边的距离，top,bottom:元素顶部/底部相对于视口顶部的距离
        //   注意： 最新的浏览器才有width和height属性。
        //          如果你需要获得相对于整个网页左上角定位的属性值，那么只要给top、left属性值加上当前的滚动位置。
        var box = element.getBoundingClientRect();
        return {
            left: box.left + (window.pageXOffset - document.documentElement.clientLeft),
            top: box.top + (window.pageYOffset - document.documentElement.clientTop)
        };
    }
     /**
     * 拷贝源对象自身的并且可枚举的属性到目标对象
     * @param {*} obj - The object to be extended.
     * @param {*} args - The rest objects which will be merged to the first object.
     * @returns {Object} The extended object.
     */
    var assign = Object.assign || function assign(obj) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        if (isObject(obj) && args.length > 0) {
            args.forEach(function (arg) {
                if (isObject(arg)) {
                Object.keys(arg).forEach(function (key) {
                    obj[key] = arg[key];
                });
                }
            });
        }

        return obj;
    };

    /**
     * 获取一组坐标的中心点坐标.移动缩放时可以用
     * @param {Object} pointers 目标的所有顶点
     * @returns {Object} The center point coordinate.
     */
    function getPointersCenter(pointers) {
        var pageX = 0, pageY = 0, count = 0;
        $.each(pointers, function (index, pointer) {
            var startX = pointer.startX,
                startY = pointer.startY;
            pageX += startX;
            pageY += startY;
            count += 1;
        });
        pageX /= count;
        pageY /= count;
        return {
            pageX: pageX,
            pageY: pageY
        };
    }
    // jquery的each()方法。$.each(data, callback(index, item, data))

    // 生成全局唯一标识符guid(默认第一位是字母G,128位)
    function generateGUID(preStr){
        var guid = 'gxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); // Math.random()*16|0获取0~15的整数
            return v.toString(16);
        }).toUpperCase();
        return typeof preStr === 'string' ? preStr + guid : guid;
    }
    // 是否是数字
    function isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }
    // 是否是函数
    function isFunction(value) {
        return typeof value === 'function';
    }
    // 是否是对象
    function isObject(value) {
        return _typeof(value) === 'object' && value !== null;
    }
    // 是否是字符串
    function isString(value){
        return typeof value === 'string';
    }
    
    var REGEXP_SUFFIX = /^(?:width|height|left|top|marginLeft|marginTop)$/;
    /**
     * Apply styles to the given element.
     * @param {Element} element - The target element.
     * @param {Object} styles - The styles for applying.
     */
    function setStyle(element, styles) {
        var style = element.style;
        $.each(styles, function (property, value) {
            if (REGEXP_SUFFIX.test(property) && isNumber(value)) {
                value += 'px';
            }
            style[property] = value;
        });
    }
     /**
     * Get transforms base on the given object.
     * @param {Object} obj - The target object.
     * @returns {string} A string contains transform values.
     */

    function getTransforms(_ref) {
        var rotate = _ref.rotate,
            scaleX = _ref.scaleX,
            scaleY = _ref.scaleY,
            translateX = _ref.translateX,
            translateY = _ref.translateY;
        var values = [];
        // 位移
        if (isNumber(translateX) && translateX !== 0) {
            values.push( "translateX(".concat(translateX, "px)") );
        }
        if (isNumber(translateY) && translateY !== 0) {
            values.push("translateY(".concat(translateY, "px)"));
        } // Rotate should come first before scale to match orientation transform
        // 旋转
        if (isNumber(rotate) && rotate !== 0) {
            values.push("rotate(".concat(rotate, "deg)"));
        }
        // 缩放
        if (isNumber(scaleX) && scaleX !== 1) {
            values.push("scaleX(".concat(scaleX, ")"));
        }
        if (isNumber(scaleY) && scaleY !== 1) {
            values.push("scaleY(".concat(scaleY, ")"));
        }

        var transform = values.length ? values.join(' ') : 'none';
        return {
            WebkitTransform: transform,
            msTransform: transform,
            transform: transform
        };
    }

    // 基础类
    function Tiny(conf) {
        this.init(conf);
    }
    // 给类添加属性方法
    Tiny.extend = function(obj){
        var extended = obj.extend;
        for (var i in obj) {
            Tiny[i] = obj[i];
        }
        if (extended) { extended(Tiny); }
    };
    // 给实例添加属性方法
    Tiny.include = function(obj){
        var included = obj.included;
        for (var i in obj) {
            Tiny.prototype[i] = obj[i];
        }
        if (included) { included(Tiny); }
    };
    Tiny.extend( Event() );
    Tiny.extend({
        generateGUID: generateGUID,

    });
    Tiny.include( Event() );
    Tiny.include({
        init: function(conf){
            var me = this;
            // 配置参数
            this.defconf = {
                tooltip: true,          // 缩放时是否显示当前缩放比例， boolean
                transition: true,       // 是否使用过渡， boolean
                // fullscreen: true,       // 是否全屏
                movable: true,          // 能否移动
                rotatable: true,        // 能否旋转
                scalable: true,         // 是否可扩展(即上下翻转，左右翻转)
                zoomable: true,         // 能否缩放图片
                zoomOnWheel: true,      // 能否鼠标滚轮缩放图片
                zoomRatio:  0.1,        // 缩放比例，number
                minZoomRatio: 0.01,     // 最小缩放比例,number
                maxZoomRatio: 100,      // 最大缩放比例,number
                toolbar: false,         // 是否显示工具栏（Boolean|Number|Object）
                // loading: boolean,
                url: '',
                pattern: 'img',         // 元素类型，img,div
                // 下边是事件回调方法。 ready:null, show:null, ...
                ready: null,    // function (e) { console.log(e.type); },
                show: null,
                shown: null,
                hide: null,
                hidden: null,
                view: null,
                viewed: null,
                zoom: null,         // 缩放前执行的回调函数 function (e) { console.log(e.type); }
                zoomed: null,       // 缩放后执行的回调函数 function (e) { console.log(e.type); }
            };
            this.options = $.extend(true, {}, this.defconf, conf);
            // obj对象的参数
            var op = this.options;
            this.tinyData = {
                left: op.left || 0,
                top: op.top || 0,
                width: op.width || 80,          // 目前宽度
                height: op.height || 80,        // 目前高度
                naturalWidth: op.naturalWidth || op.width || 80,        // 对象的原始宽度
                naturalHeight: op.naturalHeight || op.height || 80,     // 对象的原始高度
                aspectRatio: undefined,         // 纵横比，用于确认哪个作为长边。naturalWidth / naturalHeight
                zIndex: op.zIndex || 1000,
                rotate: op.rotate || 0,         // 旋转角度
                ratio: op.ratio || 1,           // 缩放比例。oldRatio通过计算获得，即oldRatio = width / naturalWidth
                movable: op.movable,            // 能否可移动
                rotatable: op.rotatable,        // 能否可旋转
                zoomable: op.zoomable,          // 能否可缩放图片
                zoomOnWheel: op.zoomOnWheel,    // 能否可鼠标滚轮缩放图片
                // scalable: true,              // 是否可扩展(即上下翻转，左右翻转)
            };
            this.tinyData.aspectRatio = this.tinyData.naturalWidth / this.tinyData.naturalHeight;

            this.id = op.id || Tiny.generateGUID(),             // id
            this.element = document.getElementById( this.id );  // 元素对象
            this.out = isString(op.out) ? document.querySelector(op.out) : op.out;   // Tiny元素的包含元素对象
            this.title = op.tiny || '';        // 图片的名字
            // this.pointers = {},   // 移动设备上用的，如存放缩放手指坐标，格式：{0:{startX:xx, startY:xx}, 1:{startX:xx, startY:xx}, ...}
            this.index = op.index || 0;     // 图片的序号
            this.isZooming = false;         // 是否正在缩放
            this.wheeling = false;          // 是否正在滚轮中
            this.isHiding = false;          // 是否隐藏中
            this.initialObjData = null;     // 初始状态参数对象,属性值同this.tinyData
            // viewed,
            // played,
            // viewing,
            // imageRendering,
            // imageInitializing,

            this.initHtml();
            this.bindEvents();      // 绑定事件
        },
        // 初始化tiny的html元素
        initHtml: function initHtml(){
            var me = this, 
                tinyStr, $tiny;
            if ( me.options.pattern === 'div' ) {
                tinyStr = '<div id="' + me.id + '"></div>';
            } else if ( me.options.pattern === 'img' ) {
                tinyStr = '<img id="' + me.id + '" src="' + me.options.src+ '">';
            }
            $tiny = $( tinyStr );
            this.element = $tiny[0];  // 元素对象
            this.out.appendChild( this.element );
            this.renderImage();
        },
        // 绑定tiny对象事件
        bindEvents: function bindEvents(){
            var options = this.options;

            if (isFunction(options.zoom)) {
                me.on('zoom', options.zoom);
            }
            if (isFunction(options.zoomed)) {
                me.on('zoomed', options.zoomed);
            }
        },
        // 获取元素对象的中心点
        getPointersCenter: function(){
            return getPointersCenter( this.pointers );
        },
        // 移动元素对象。 offsetX,offsetY {number} 移动偏移。 returns当前对象
        move: function move(offsetX, offsetY) {
            var x = this.tinyData.left + Number(offsetX),
                y = this.tinyData.top + Number(offsetY);
            this.moveTo(x, y);
            return this;
        },
        // 移动元素对象至某个指定位置。 x, y {number} 位置坐标。 return当前对象
        moveTo: function moveTo(x, y) {
            x = Number(x);
            y = Number(y);
            console.warn('moveTo的x,y：',x, y);

            if (this.options.movable) {
                if (isNumber(x) && isNumber(y)) {
                    this.tinyData.left = x;
                    this.tinyData.top = y;
                    this.renderImage();
                }
            }
            return this;
        },
        // 缩放元素对象。 ratio：缩放比例， hasTooltip：{booldean} 是否显示缩放比例,可选，默认false, return当前对象
        zoom: function zoom(ratio, hasTooltip, _originalEvent) {
            ratio = Number(ratio);
            ratio = ratio < 0 ? 1 / (1 - ratio) : 1 + ratio;
            var newRatio = (this.tinyData.width * ratio) / this.tinyData.naturalWidth;
            this.zoomTo(newRatio, hasTooltip, _originalEvent);
            return this;
        },   
        /**
         * Zoom the image to an absolute ratio.
         * @param {number} ratio - The target ratio.
         * @param {boolean} [hasTooltip=false] - Indicates if it has a tooltip or not.
         * @param {Event} [_originalEvent=null] - The original event if any. 鼠标事件，从中可以获取缩放点的位置
         * @returns {Viewer} this
         */
        // 缩放元素对象至指定比例。 ratio:缩放比例， hasTooltip：是否显示缩放比例,可选，默认false
        zoomTo: function zoomTo(ratio, hasTooltip, _originalEvent) {
            var me = this;
            var tinyData = this.tinyData;
            var width = tinyData.width,
                height = tinyData.height,
                left = tinyData.left,
                top = tinyData.top,
                naturalWidth = tinyData.naturalWidth,
                naturalHeight = tinyData.naturalHeight;

            ratio = Number(ratio);
            hasTooltip = hasTooltip ? true : false;
            _originalEvent = _originalEvent ? _originalEvent : null;

            if ( !isNumber(ratio) ) { return this; }
            if (ratio > 0.95 && ratio < 1.05) { ratio = 1; }
            ratio = Math.max(0, ratio);
    
            if (me.options.zoomable) {
                var newWidth = naturalWidth * ratio;    // 缩放后的宽度
                var newHeight = naturalHeight * ratio;  // 缩放后的高度
                var offsetWidth = newWidth - width;     // 补偿宽度
                var offsetHeight = newHeight - height;  // 补偿高度
                var oldRatio = width / naturalWidth;    // 老缩放值
 
                me.emit('zoom', {
                    ratio: ratio,
                    oldRatio: oldRatio,
                    originalEvent: _originalEvent
                });
                // 如果zoom触发事件中，阻止继续缩放，则返回
                if (this.abortZoom === true) {
                    this.abortZoom = false;
                    return this;
                }

                this.zooming = true;
                // 以鼠标位置缩放
                if (_originalEvent) {
                    var offset = getOffset(me.element);
                    // event.pageX 和 event.pageY获取到的是触发点相对文档区域左上角距离，会随着页面滚动而改变。IE9+支持
                    var center = {
                        pageX: _originalEvent.pageX,   
                        pageY: _originalEvent.pageY
                    }; // Zoom from the triggering point of the event      
                    tinyData.left -= offsetWidth * ((center.pageX - offset.left - left) / width);
                    tinyData.top -= offsetHeight * ((center.pageY - offset.top - top) / height);
                // 以元素中心点缩放
                } else {
                    tinyData.left -= offsetWidth / 2;
                    tinyData.top -= offsetHeight / 2;
                }
                tinyData.width = newWidth;
                tinyData.height = newHeight;
                tinyData.ratio = ratio;

                this.renderImage(function () {
                    me.zooming = false;
                    me.emit('zoomed', {
                        ratio: ratio,
                        oldRatio: oldRatio,
                        originalEvent: _originalEvent
                    });
                });
    
                if (hasTooltip) {
                    this.tooltip();
                }
            }
            return this;
        },
        /**
         * Rotate the image with a relative degree.
         * @param {number} degree - The rotate degree.
         * @returns {Viewer} this
         */
        rotate: function rotate(degree) {
            this.rotateTo( (this.tinyData.rotate || 0) + Number(degree) );
            return this;
        },
    
        /**
         * Rotate the image to an absolute degree.
         * @param {number} degree - The rotate degree.
         * @returns {Viewer} this
         */
        rotateTo: function rotateTo(degree) {
            degree = Number(degree);
            if (isNumber(degree) && this.options.rotatable) {
                this.tinyData.rotate = degree;
                this.renderImage();
            }
            return this;
        },
        // 渲染元素方法. done：回调函数
        renderImage: function renderImage(done) {
            var me = this;
        
            var element = this.element,
                tinyData = this.tinyData;
            setStyle(element, assign({
                width: tinyData.width,
                height: tinyData.height,
                // XXX: Not to use translateX/Y to avoid element shaking when zooming
                // 这儿偏移是使用margin-left和margin-top实现的
                marginLeft: tinyData.left,
                marginTop: tinyData.top
            }, getTransforms(tinyData)));
        
            if (done) { done(); }
        },
        // Show the current ratio of the image with percentage
        tooltip: function tooltip() {
            var _this7 = this;
    
            var options = this.options,
                tooltipBox = this.tooltipBox,
                tinyData = this.tinyData;
    
            if (!this.viewed || this.played || !options.tooltip) {
            return this;
            }
    
            tooltipBox.textContent = "".concat(Math.round(tinyData.ratio * 100), "%");
    
            if (!this.tooltipping) {
            if (options.transition) {
                if (this.fading) {
                dispatchEvent(tooltipBox, EVENT_TRANSITION_END);
                }
    
                addClass(tooltipBox, CLASS_SHOW);
                addClass(tooltipBox, CLASS_FADE);
                addClass(tooltipBox, CLASS_TRANSITION); // Force reflow to enable CSS3 transition
    
                tooltipBox.initialOffsetWidth = tooltipBox.offsetWidth;
                addClass(tooltipBox, CLASS_IN);
            } else {
                addClass(tooltipBox, CLASS_SHOW);
            }
            } else {
            clearTimeout(this.tooltipping);
            }
    
            this.tooltipping = setTimeout(function () {
            if (options.transition) {
                addListener(tooltipBox, EVENT_TRANSITION_END, function () {
                removeClass(tooltipBox, CLASS_SHOW);
                removeClass(tooltipBox, CLASS_FADE);
                removeClass(tooltipBox, CLASS_TRANSITION);
                _this7.fading = false;
                }, {
                once: true
                });
                removeClass(tooltipBox, CLASS_IN);
                _this7.fading = true;
            } else {
                removeClass(tooltipBox, CLASS_SHOW);
            }
    
            _this7.tooltipping = false;
            }, 1000);
            return this;
        },
        // Reset the image to its initial state
        reset: function reset() {
            if (this.viewed && !this.played) {
            this.tinyData = assign({}, this.initialObjData);
            this.renderImage();
            }
    
            return this;
        },
        // Destroy the viewer
        destroy: function destroy() {
            var element = this.element,
                options = this.options;
    
            if (!element[NAMESPACE]) {
            return this;
            }
    
            this.destroyed = true;
    
            if (this.ready) {
            if (this.played) {
                this.stop();
            }
    
            if (options.inline) {
                if (this.fulled) {
                this.exit();
                }
    
                this.unbind();
            } else if (this.isShown) {
                if (this.viewing) {
                if (this.imageRendering) {
                    this.imageRendering.abort();
                } else if (this.imageInitializing) {
                    this.imageInitializing.abort();
                }
                }
    
                if (this.hiding) {
                this.transitioning.abort();
                }
    
                this.hidden();
            } else if (this.showing) {
                this.transitioning.abort();
                this.hidden();
            }
    
            this.ready = false;
            this.viewer.parentNode.removeChild(this.viewer);
            } else if (options.inline) {
            if (this.delaying) {
                this.delaying.abort();
            } else if (this.initializing) {
                this.initializing.abort();
            }
            }
    
            if (!options.inline) {
            removeListener(element, EVENT_CLICK, this.onStart);
            }
    
            element[NAMESPACE] = undefined;
            return this;
        },
        initImage: function initImage(done) {
            var me = this;
      
            var options = this.options,
                image = this.image,
                viewerData = this.viewerData;
            var footerHeight = this.footer.offsetHeight;
            var viewerWidth = viewerData.width;
            var viewerHeight = Math.max(viewerData.height - footerHeight, footerHeight);
            var oldImageData = this.tinyData || {};
            var sizingImage;
            this.imageInitializing = {
              abort: function abort() {
                sizingImage.onload = null;
              }
            };
            sizingImage = getImageNaturalSizes(image, function (naturalWidth, naturalHeight) {
              var aspectRatio = naturalWidth / naturalHeight;
              var width = viewerWidth;
              var height = viewerHeight;
              me.imageInitializing = false;
      
              if (viewerHeight * aspectRatio > viewerWidth) {
                height = viewerWidth / aspectRatio;
              } else {
                width = viewerHeight * aspectRatio;
              }
      
              width = Math.min(width * 0.9, naturalWidth);
              height = Math.min(height * 0.9, naturalHeight);
              var tinyData = {
                naturalWidth: naturalWidth,
                naturalHeight: naturalHeight,
                aspectRatio: aspectRatio,
                ratio: width / naturalWidth,
                width: width,
                height: height,
                left: (viewerWidth - width) / 2,
                top: (viewerHeight - height) / 2
              };
              var initialObjData = assign({}, tinyData);
      
              if (options.rotatable) {
                tinyData.rotate = oldImageData.rotate || 0;
                initialObjData.rotate = 0;
              }
      
              if (options.scalable) {
                tinyData.scaleX = oldImageData.scaleX || 1;
                tinyData.scaleY = oldImageData.scaleY || 1;
                initialObjData.scaleX = 1;
                initialObjData.scaleY = 1;
              }
      
              me.tinyData = tinyData;
              me.initialObjData = initialObjData;
      
              if (done) {
                done();
              }
            });
        },
        // 滚轮缩放事件方法。向下滚动缩小，向上滚动放大
        wheel: function wheel(event) {
            var me = this;
            // if (!this.viewed) {
            //     return;
            // }
            event.preventDefault(); 

            // Limit wheel speed to prevent zoom too fast
            if (this.wheeling) { return; }
            this.wheeling = true;
            setTimeout(function () {
                me.wheeling = false;
            }, 50);

            var ratio = Number(this.options.zoomRatio) || 0.1;
            var delta = 1;
            // 1.deltaY属性在向下滚动时返回正值，向上滚动时返回负值，否则为0。只读。
            //   deltaX属性在向右滚动时返回正值，向左滚动时返回负值，否则为0。只读。大多数鼠标设备无法向左和向右滚动，并且始终返回0
            // 2.IE、chrome监听的是wheelDelta,向下滚动其值为-120；向上滚动其值为120
            //   FF监听的是detail,向下滚动其值为3；向上滚动其值为-3
            // 在滚轮滚动时mousewheel是一次次触发的。这儿，向下滚动时delta=1，向上滚动时delta=-1
            if (event.deltaY) {
                delta = event.deltaY > 0 ? 1 : -1;
            } else if (event.wheelDelta) {
                delta = -event.wheelDelta / 120;
            } else if (event.detail) {
                delta = event.detail > 0 ? 1 : -1;
            }
            this.zoom(-delta * ratio, true, event); // 向下滚动时缩小，因传入负值
        }

    });

    window.Tiny = Tiny;
    // assign(Viewer.prototype, render, events, handlers, methods, others);
    // return Viewer;
})(window, document, jQuery)