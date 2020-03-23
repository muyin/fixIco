// 每个图片就是一个viewer对象。尽量返回对象本身，实现链式调用
{
    // 1.参数
    element,    // 元素
    // 配置参数,
    options = {
        inline: boolean,    // true: 'inline', false:'modal'
        tooltip: true,          // 缩放时是否显示当前缩放比例， boolean
        transition: true,       // 是否使用过渡， boolean
        fullscreen: true,       // 是否全屏

        movable: true,          // 能否移动
        rotatable: true,        // 能否旋转
        scalable: true,         // 是否可扩展(即上下翻转，左右翻转)
        zoomable: true,         // 能否缩放图片
        zoomOnWheel: true,      // 能否鼠标滚轮缩放图片
      
        zoomRatio:  0.1,        // 缩放比例，number
        minZoomRatio: 0.01,     // 最小缩放比例,number
        maxZoomRatio: 100,      // 最大缩放比例,number

        loading: boolean,
        url: 'data-original',
        // 下边是事件回调方法。 ready:null, show:null, ...
        ready: function (e) { console.log(e.type); },
        show: function (e) { console.log(e.type); },
        shown: function (e) { console.log(e.type); },
        hide: function (e) { console.log(e.type); },
        hidden: function (e) { console.log(e.type); },
        view: function (e) { console.log(e.type); },
        viewed: function (e) { console.log(e.type); },
        zoom: function (e) { console.log(e.type); },
        zoomed: function (e) { console.log(e.type); }
    },    
    pointers,   // 
    title,
    canvas,
    items,      // 包含多张图片
    viewed,
    played,
    index,
    timeout,
    viewer,
    isShown,

    zooming,
    hiding,     // boolean，是否隐藏中
    viewing,
    imageRendering,
    imageInitializing,

    imageData = {
        width,
        height,
        left,
        top,
        naturalWidth,
        naturalHeight,
        rotate,
        ratio,      // oldRatio通过计算获得，即oldRatio = width / naturalWidth
        scaleX,
        scaleY,

        movable,    // 是否可移动
        zoomable,   // 是否可缩放
        rotatable,  // 是否可旋转
        scalable,   // 是否可扩展的，即上下翻转，左右翻转
    },
    // 2.方法
    // Show the viewer (only available in modal mode)   // 返回this
    show(immediate = false)
    // Hide the viewer (only available in modal mode)   // 返回this
    hide(immediate = false)

    //  View one of the images with image's index.  // 返回this
    view(index = this.options.initialViewIndex)
    // View the previous image                      // 返回this,调用 view() 方法实现
    prev(loop = false)
    // View the next image                          // 返回this,调用 view() 方法实现
    next(loop = false)

    // Move the image with relative offsets.        // 返回this,调用moveTo() 方法实现
    move(offsetX, offsetY)  
    // Move the image to an absolute point.         // 返回this,设置对象参数后，调用 renderImage() 方法实现
    moveTo(x, y = x)

    // Zoom the image with a relative ratio.        // 返回this,调用 zoomTo() 方法实现
    zoom(ratio, hasTooltip = false, _originalEvent = null)
    // Zoom the image to an absolute ratio.         // 返回this,设置对象参数后，调用 renderImage() 方法实现
    zoomTo(ratio, hasTooltip = false, _originalEvent = null, _zoomable = false)

    // Rotate the image with a relative degree.     // 返回this,调用 rotateTo() 方法实现
    rotate(degree)
    // Rotate the image to an absolute degree.      // 返回this,设置对象参数后，调用 renderImage() 方法实现
    rotateTo(degree)

    // Scale the image on the x-axis.   // 返回this,调用 scale() 方法实现
    scaleX(scaleX)
    // Scale the image on the y-axis.   // 返回this,调用 scale() 方法实现
    scaleY(scaleY)
    // Scale the image.                 // 返回this,设置对象参数后，调用 renderImage() 方法实现;
    scale(scaleX, scaleY = scaleX)

    // Play the images
    play(fullscreen = false)
    // Stop play
    stop()
    // Enter modal mode (only available in inline mode)
    full()
    // Exit modal mode (only available in inline mode)
    exit()
    // Show the current ratio of the image with percentage
    tooltip()
    // Toggle the image size between its natural size and initial size
    toggle()
    // Reset the image to its initial state
    reset()
    // Update viewer when images changed
    update()
    // Destroy the viewer
    destroy()
    // 渲染图片
    renderImage(done)
}