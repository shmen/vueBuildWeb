
var rulerEvent = function () {
    "use strict";
    this.attach = function (evtName, element, listener, capture) {
        var evt         = '',
            useCapture  = (capture === undefined) ? true : capture,
            handler     = null;

        if (window.addEventListener === undefined) {
            evt = 'on' + evtName;
            handler = function (evt, listener) {
                element.attachEvent(evt, listener);
                return listener;
            };
        } else {
            evt = evtName;
            handler = function (evt, listener, useCapture) {
                element.addEventListener(evt, listener, useCapture);
                return listener;
            };
        }

        return handler.apply(element, [evt, function (ev) {
            var e   = ev || event,
                src = e.srcElement || e.target;

            listener(e, src);
        }, useCapture]);
    };

    this.detach = function (evtName, element, listener, capture) {
        var evt         = '',
            useCapture  = (capture === undefined) ? true : capture;

        if (window.removeEventListener === undefined) {
            evt = 'on' + evtName;
            element.detachEvent(evt, listener);
        } else {
            evt = evtName;
            element.removeEventListener(evt, listener, useCapture);
        }
    };

    this.stop = function (evt) {
        evt.cancelBubble = true;

        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
    };

    this.prevent = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
        } else {
            evt.returnValue = false;
        }
    };
};
var Dragdrop = function (evt) {
    "use strict";
    var elem        = null,
        started     = 0,
        self        = this,
        moveHandler = null,
        doc         = document.documentElement,
        body        = document.body,
        gWidth      = (document.body.scrollWidth > document.documentElement.clientWidth)
                      ? document.body.scrollWidth
                      : document.documentElement.clientWidth,
        gHeight     = Math.max(body.scrollHeight, body.offsetHeight, doc.clientHeight, doc.scrollHeight, doc.offsetHeight),
        move        = function (e) {
            var xDiff   = e.clientX - elem.posX,
                yDiff   = e.clientY - elem.posY,
                x       = xDiff - (xDiff % elem.snap) + 'px',
                y       = yDiff - (yDiff % elem.snap) + 'px';

            if (started === 1) {
                switch (elem.mode) {
                case 0:
                    elem.style.top = y;
                    elem.style.left = x;
                    break;
                case 1:
                    elem.style.left = x;
                    break;
                case 2:
                    elem.style.top = y;
                    break;
                }

                if (elem.mode !== 2) {
                    if (xDiff <= elem.minX) {
                        elem.style.left = elem.minX + 'px';
                    }

                    if (elem.offsetLeft + elem.offsetWidth >= elem.maxX) {
                        elem.style.left = (elem.maxX - elem.offsetWidth) + 'px';
                    }
                }

                if (elem.mode !== 1) {
                    if (yDiff <= elem.minY) {
                        elem.style.top = elem.minY + 'px';
                    }

                    if (elem.offsetTop + elem.offsetHeight >= elem.maxY) {
                        elem.style.top = (elem.maxY - elem.offsetHeight) + 'px';
                    }
                }

                elem.onMove(elem);
            }
        },
        start       = function (e, src) {
            if (src.className.indexOf('draggable') !== -1) {

                evt.prevent(e);

                moveHandler = evt.attach('mousemove', document, move, true);
                started = 1;

                elem = src;
                elem.posX = e.clientX - elem.offsetLeft;
                elem.posY = e.clientY - elem.offsetTop;

                if (elem.mode === undefined) {
                    self.set(elem);
                }

                elem.onStart(elem);

                if (elem.setCapture) {
                    elem.setCapture();
                }
            }
        },
        stop        = function () {
            if (started === 1) {
                started = 0;
                elem.onStop(elem);
                evt.detach('mousemove', document, moveHandler);

                if (elem.releaseCapture) {
                    elem.releaseCapture();
                }
            }
        };

    evt.attach('mousedown', document, start, false);
    evt.attach('mouseup', document, stop, false);

    this.start = start;

    this.set = function (element, elemOptions) {
        var options = elemOptions       || {};

        elem = (typeof element === 'string')
                ? document.getElementById(element)
                : element;

        elem.mode           = options.mode      || 0;
        elem.minX           = options.minX      || 0;
        elem.maxX           = options.maxX      || gWidth;
        elem.minY           = options.minY      || 0;
        elem.maxY           = options.maxY      || gHeight;
        elem.snap           = options.snap      || 1;
        elem.onStart        = options.onstart   || function () {};
        elem.onMove         = options.onmove    || function () {};
        elem.onStop         = options.onstop    || function () {};

        elem.style.left     = elem.offsetLeft + 'px';
        elem.style.top      = elem.offsetTop + 'px';

        elem.unselectable   = 'on';
    };
};

var RulersGuides = function (evt, dragdrop,containerWidth) {
    'use strict';
    containerWidth = containerWidth || 1100;//默认宽度1100
    var doc         = document.documentElement,
        body        = document.body,
        wrapper     = null,
        lockHandler = null,
        locked      = 1,
        hRuler      = null,
        vRuler      = null,
        menu        = null,
        dialogs     = [],
        snapDialog  = null,
        openGridDialog = null,
        xSnap       = 0,
        ySnap       = 0,
        mode        = 2,
        guides      = {},
        guidesCnt   = 0,
        gUid        = '',
        rulerStatus = 1,
        guideStatus = 1,
        hBound      = 0,
        vBound      = 0,
        gridList    = null,
        gridListLen = 0,
        menuBtn     = null,
        gInfoBlockWrapper = null,
        detailsStatus = 0,
        domElements = [],
        domDimensions = [],
        resizeTimer = null,
        snapDom     = 0,
        vPos        = 51,
        hPos        = 36,
        cssText     = '',
        yxj  =  0, // zyx edit
    //Ruler     = function (type, size) {
        Ruler       = function (type, size ,leftWidth) {
            var ruler       = document.createElement('div'),
                i           = 0,
                span        = document.createElement('span'),
                label       = null,
                labelTxt    = null,
                spanFrag    = document.createDocumentFragment(),
                cnt         = Math.floor(size / 2);
            /*start*/
            if(type == "h") {
                yxj = Math.floor((leftWidth[0]-containerWidth)/2)+15;//先以1100计算为基础
                var m = Math.floor(yxj/50),
                    k = Math.floor(yxj%50/2);
                yxj%50/2 >= 0.5 ? k += 1 : k=k;
                if(isIE() && k > 0) k -= 1;
                if(isSafri() && k > 0) k -= 1;//safri 差1像素
                //if(isFf() && k > 0) k -= 1;//safri 差1像素
                cnt = cnt - k;
                for(var aa=0;aa<k+5;aa++) {
                    span = span.cloneNode(false);
                    spanFrag.appendChild(span);
                }
            }/*else if(type == "v") {
             for(var aa=0;aa<16;aa++) {
             span = span.cloneNode(false);
             spanFrag.appendChild(span);
             }
             }*/
            /*end*/
            ruler.className = 'ruler ' + type + ' unselectable';
            /*********************刻度单位**************************/
            for (i; i < cnt; i = i + 1) {
                span = span.cloneNode(false);

                if (i % 25 === 0) {
                    span.className = 'milestone';

                    if (i > 0) {
                        label = span.cloneNode(false);
                        label.className = 'label';

                        if (i < 50) {
                            label.className += ' l10';
                        } else if (i >= 50 && i < 500) {
                            label.className += ' l100';
                        } else if (i >= 500) {
                            label.className += ' l1000';
                        }

                        //labelTxt = document.createTextNode(i * 2);
                        /*start*/
                        if(0 <= m*50 && type == "h") {
                            labelTxt = document.createTextNode(-(m*50));
                            m--;
                        } else {
                            if(type == "h") labelTxt = document.createTextNode(parseInt(i*2)-(Math.floor(yxj/50)+1)*50);
                            else labelTxt = document.createTextNode(i * 2);
                        }
                        /*end*/
                        label.appendChild(labelTxt);
                        span.appendChild(label);
                    }
                    /*************************刻度单位end*****************************/
                    span.className = 'milestone';
                } else if (i % 5 === 0) {
                    span.className = 'major';
                } else {
                    span.className = '';
                    span.removeAttribute('class');
                }

                if(i%5 == 0 && i>=25) spanFrag.appendChild(span);
            }

            ruler.appendChild(spanFrag);

            return ruler;
        },
        getWindowSize = function () {
            var w = Math.max(
                body.scrollWidth,
                body.offsetWidth,
                doc.clientWidth,
                doc.scrollWidth,
                doc.offsetWidth
                ),
                h = Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    doc.clientHeight,
                    doc.scrollHeight,
                    doc.offsetHeight
                );

            return [w, h];
        },
        getScrollPos = function () {
            var t = Math.max(doc.scrollTop, body.scrollTop),
                l = Math.max(doc.scrollLeft, body.scrollLeft);

            return [t, l];
        },
        getScrollSize = function () {
            var w = Math.max(doc.scrollWidth, body.scrollWidth),
                h = Math.max(doc.scrollHeight, body.scrollHeight);

            return [w, h];
        },
        closeAllDialogs = function () {
            var i = 0;

            for (i; i < dialogs.length; i = i + 1) {
                dialogs[i].close();
            }
        },
        removeInboundGuide = function (guide, gUid) {
            var scrollPos = getScrollPos();

            if (
                rulerStatus === 1 && guideStatus === 1 && (
                    (guide.className === 'guide h draggable' && guide.offsetTop < hBound + scrollPos[0]) || (guide.className === 'guide v draggable' && guide.offsetLeft < vBound + scrollPos[1])
                )
            ) {
                wrapper.removeChild(guide);
                delete guides[gUid];
                guidesCnt = guidesCnt - 1;
            }
        },
        removeInboundGuides = function () {
            var i;

            for (i in guides) {
                if (guides.hasOwnProperty(i)) {
                    removeInboundGuide(guides[i], i);
                }
            }
        },
        toggleGuides = function () {
            var i;

            guideStatus = 1 - guideStatus;

            for (i in guides) {
                if (guides.hasOwnProperty(i)) {
                    guides[i].style.display = (guideStatus === 1)
                        ? 'block'
                        : 'none';
                }
            }

            if (guideStatus === 1) {
                wrapper.style.display = 'block';
            }
        },
        toggleRulers = function () {
            rulerStatus = 1 - rulerStatus;
            if (rulerStatus === 1) {
                vRuler.style.display = 'block';
                hRuler.style.display = 'block';
                wrapper.style.display = 'block';
                $('#HTMLDATA').css({'padding-top':'70px','padding-left':'20px'});
                removeInboundGuides();
            } else {
                vRuler.style.display = 'none';
                hRuler.style.display = 'none';
                $('#HTMLDATA').css({'padding-top':'50px','padding-left':'0px'});
            }
        },
        removeGrid = function (gridName) {
            if (gridList[gridName] !== undefined) {
                delete gridList[gridName];
                window.localStorage.setItem('RulersGuides', JSON.stringify(gridList));
                gridListLen = gridListLen - 1;
            }
        },
        deleteGuides = function () {
            var i;

            if (guidesCnt > 0) {
                for (i in guides) {
                    if (guides.hasOwnProperty(i)) {
                        wrapper.removeChild(guides[i]);
                        delete guides[i];
                        guidesCnt = guidesCnt - 1;
                    }
                }
                gInfoBlockWrapper.style.display = 'none';
            }
        },
        renderGrid = function (gridName) {
            if (gridList[gridName] !== undefined) {
                var grid        = gridList[gridName],
                    guideId     = null,
                    guideElem   = null;

                deleteGuides();

                for (guideId in grid) {
                    if (grid.hasOwnProperty(guideId)) {
                        guideElem = document.createElement('div');
                        guideElem.id = guideId;
                        guideElem.className = grid[guideId].cssClass;
                        guideElem.style.cssText = grid[guideId].style;

                        wrapper.appendChild(guideElem);

                        guides[guideId] = guideElem;

                        guidesCnt = guidesCnt + 1;
                    }
                }
            }
        },
        OpenGridDialog = function () {
            var dialog = null,
                self = this,
                select = null,
                renderSelect = function (insertOrUpdate) {
                    var gridName,
                        options = '',
                        i;
                    gridListLen = 0;

                    if (window.localStorage) {
                        gridList = JSON.parse(window.localStorage.getItem('RulersGuides'));

                        for (i in gridList) {
                            if (gridList.hasOwnProperty(i)) {
                                gridListLen = gridListLen + 1;
                            }
                        }
                    }

                    if (insertOrUpdate === 0) {
                        select = document.createElement('select');
                        select.id = 'grid-list';
                    }

                    if (gridListLen > 0) {
                        for (gridName in gridList) {
                            if (gridList.hasOwnProperty(gridName)) {
                                options += '<option>' + gridName + '</option>';
                            }
                        }

                        select.innerHTML = options;
                    }

                    return select;
                };

            this.render = function () {
                if (dialog === null) {
                    dialog = document.createElement('div');
                    select = renderSelect(0);

                    var text = document.createTextNode(''),
                        titleBar = dialog.cloneNode(false),
                        dialogWrapper = dialog.cloneNode(false),
                        okBtn = document.createElement('button'),
                        cancelBtn = okBtn.cloneNode(false),
                        delBtn = okBtn.cloneNode(false),
                        titleBarTxt = text.cloneNode(false),
                        okBtnTxt = text.cloneNode(false),
                        cancelBtnTxt = text.cloneNode(false),
                        delBtnTxt = text.cloneNode(false);

                    titleBarTxt.nodeValue = 'Open grid';
                    okBtnTxt.nodeValue = 'OK';
                    cancelBtnTxt.nodeValue = 'Cancel';
                    delBtnTxt.nodeValue = 'Delete';

                    dialog.className = 'dialog open-dialog';
                    titleBar.className = 'title-bar';
                    dialogWrapper.className = 'wrapper';

                    okBtn.className = 'ok-btn';
                    cancelBtn.className = 'cancel-btn';
                    delBtn.className = 'del-btn';

                    titleBar.appendChild(titleBarTxt);
                    okBtn.appendChild(okBtnTxt);
                    cancelBtn.appendChild(cancelBtnTxt);
                    delBtn.appendChild(delBtnTxt);

                    //dialogWrapper.appendChild(select);
                    //dialogWrapper.appendChild(delBtn);
                    //dialogWrapper.appendChild(okBtn);
                    //dialogWrapper.appendChild(cancelBtn);

                    dialog.appendChild(titleBar);
                    //dialog.appendChild(dialogWrapper);

                    //body.appendChild(dialog);

                    evt.attach('click', delBtn, function () {
                        if (window.confirm('Are you sure ?')) {
                            if (select.options.length > 0) {
                                removeGrid(select.options[select.selectedIndex].value);

                                select.removeChild(
                                    select.options[select.selectedIndex]
                                );
                            }

                            if (select.options.length === 0) {
                                self.close();
                            }
                        }
                    });

                    evt.attach('click', okBtn, function () {
                        renderGrid(select.value);
                        self.close();
                    });

                    evt.attach('click', cancelBtn, function () {
                        self.close();
                    });
                }
            };

            this.render();

            this.open = function () {
                closeAllDialogs();

                renderSelect(1);

                if (gridListLen > 0) {
                    dialog.style.display = 'block';
                    dialog.style.left = ((doc.clientWidth - dialog.clientWidth) / 2) + 'px';
                    dialog.style.top = ((doc.clientHeight - dialog.clientHeight) / 2) + 'px';
                }
            };

            this.close = function () {
                dialog.style.display = 'none';
            };
        },
        toggleRulersLock = function () {
            if (locked === 0) {
                if (lockHandler !== null) {
                    evt.detach('scroll', window, lockHandler);
                }
            } else {
                lockHandler = evt.attach('scroll', window, function () {
                    var pos = getScrollPos(),
                        size = getScrollSize();

                    hRuler.style.top = pos[0] + 'px';
                    wrapper.style.height = size[1] + 'px';

                    vRuler.style.left = pos[1] + 'px';
                    wrapper.style.width = size[0] + 'px';
                });
            }

            locked = 1 - locked;
        },
        saveGrid = function () {
            var data = {},
                gridData = {},
                i,
                gridName = '';

            while (gridName === '' && guidesCnt > 0) {
                gridName = window.prompt('Save grid as');

                if (gridName !== '' && gridName !== false && gridName !== null && window.localStorage) {
                    for (i in guides) {
                        if (guides.hasOwnProperty(i)) {
                            gridData[i] = {
                                'cssClass' : guides[i].className,
                                'style' : guides[i].style.cssText
                            };
                        }
                    }

                    if (window.localStorage.getItem('RulersGuides') !== null) {
                        data = JSON.parse(window.localStorage.getItem('RulersGuides'));
                    }

                    data[gridName] = gridData;
                    window.localStorage.setItem('RulersGuides', JSON.stringify(data));

                    gridListLen = gridListLen + 1;
                }
            }
        },
        showDetailedInfo = function () {
            var i,
                j = 0,
                hGuides = [],
                vGuides = [],
                scrollSize = getScrollSize(),
                infoBlockWrapper = document.createElement('div'),
                infoFrag = document.createDocumentFragment(),
                infoBlock = infoBlockWrapper.cloneNode(false),
                infoBlockTxt = infoBlockWrapper.cloneNode(false),
                infoData1 = document.createTextNode(''),
                infoData2 = infoData1.cloneNode(false),
                text = '',
                br = document.createElement('br');

            for (i in guides) {
                if (guides.hasOwnProperty(i)) {
                    if (guides[i].type === 'h') {
                        hGuides.push(guides[i].y);
                    } else {
                        vGuides.push(guides[i].x);
                    }
                }
            }

            vGuides.unshift(0);
            vGuides.push(scrollSize[0]);

            hGuides.unshift(0);
            hGuides.push(scrollSize[1]);

            vGuides = vGuides.sort(function (a, b) {
                return a - b;
            });

            hGuides = hGuides.sort(function (a, b) {
                return a - b;
            });

            for (i = 0; i < hGuides.length - 1; i = i + 1) {
                j = 0;

                for (j; j < vGuides.length - 1; j = j + 1) {
                    infoBlock = infoBlock.cloneNode(false);
                    infoBlockTxt = infoBlockTxt.cloneNode(false);
                    infoData1 = infoData1.cloneNode(false);
                    infoData2 = infoData2.cloneNode(false);
                    br = br.cloneNode();

                    infoBlockWrapper.className = 'info-block-wrapper';
                    infoBlock.className = 'info-block';
                    infoBlockTxt.className = 'info-block-txt';

                    infoBlock.className += (
                        (i % 2 !== 0 && j % 2 !== 0) ||
                        (i % 2 === 0 && j % 2 === 0)
                    )
                        ? ' even'
                        : ' odd';

                    infoBlock.style.top = hGuides[i] + 'px';
                    infoBlock.style.left = vGuides[j] + 'px';
                    infoBlock.style.width = (vGuides[j + 1] - vGuides[j]) + 'px';
                    infoBlock.style.height = (hGuides[i + 1] - hGuides[i]) + 'px';

                    text = (vGuides[j + 1] - vGuides[j]) + ' x ' + (hGuides[i + 1] - hGuides[i]);

                    infoData1.nodeValue = text;

                    text = hGuides[i] + ' : ' + vGuides[j];

                    infoData2.nodeValue = text;

                    infoBlockTxt.appendChild(infoData1);
                    infoBlockTxt.appendChild(br);
                    infoBlockTxt.appendChild(infoData2);

                    infoBlock.appendChild(infoBlockTxt);

                    infoBlockTxt.style.marginTop = (i === 0) ? '31px' : '0';
                    infoBlockTxt.style.marginLeft = (j === 0) ? '42px' : '0';

                    infoFrag.appendChild(infoBlock);
                }
            }

            infoBlockWrapper.appendChild(infoFrag);

            if (detailsStatus === 1) {
                wrapper.replaceChild(infoBlockWrapper, gInfoBlockWrapper);
                gInfoBlockWrapper = infoBlockWrapper;
            } else {
                gInfoBlockWrapper.style.display = 'none';
            }
        },
        calculateDomDimensions = function () {
            var x = [],
                y = [],
                dm = [],
                i = 0,
                len = domElements.length,
                findDimensions = function (elem) {
                    var t = 0,
                        l = 0,
                        w = elem.offsetWidth,
                        h = elem.offsetHeight;

                    while (elem) {
                        l += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
                        t += (elem.offsetTop - elem.scrollTop + elem.clientTop);
                        elem = elem.offsetParent;
                    }

                    return [l, t, l + w, t + h];
                },
                getUnique = function (arr) {
                    var u = {}, a = [], idx = 0, arrLen = arr.length;

                    for (idx; idx < arrLen; idx = idx + 1) {
                        if (u.hasOwnProperty(arr[idx]) === false) {
                            a.push(arr[idx]);
                            u[arr[idx]] = 1;
                        }
                    }

                    return a;
                };

            for (i; i < len; i = i + 1) {
                dm = findDimensions(domElements[i]);

                x.push(dm[0]);
                x.push(dm[2]);

                y.push(dm[1]);
                y.push(dm[3]);
            }

            x = getUnique(x).sort(function (a, b) {
                return a - b;
            });

            y = getUnique(y).sort(function (a, b) {
                return a - b;
            });

            return [x, y];
        },
        Menu = function () {
            var menuList = null,
                status   = 0,
                toggles = {},
                menuItemsList  = [
                    {
                        'text': '隐藏标尺刻度线',
                        'hotkey': 'Ctrl + Alt + R',
                        'alias': 'rulers'
                    }, {
                        'text': '隐藏标尺',
                        'hotkey': 'Ctrl + Alt + G',
                        'alias': 'guides'
                    }, {
                        'text': 'Hide all',
                        'hotkey': 'Ctrl + Alt + A',
                        'alias': 'all'
                    }, {
                        'text': 'Unlock rulers',
                        'hotkey': 'Ctrl + Alt + L',
                        'alias': 'lock'
                    }, {
                        'text': '清除所有标尺',
                        'hotkey': 'Ctrl + Alt + D',
                        'alias': 'clear'
                    }, {
                        'text': 'Open grid',
                        'hotkey': 'Ctrl + Alt + O',
                        'alias': 'open'
                    }, {
                        'text': 'Save grid',
                        'hotkey': 'Ctrl + Alt + G',
                        'alias': 'save'
                    }, {
                        'text': 'Snap to',
                        'hotkey': 'Ctrl + Alt + C',
                        'alias': 'snap'
                    }, {
                        'text': 'Show detailed info',
                        'hotkey': 'Ctrl + Alt + I',
                        'alias': 'details'
                    }, {
                        'text': 'Snap to DOM',
                        'hotkey': 'Ctrl + Alt + E',
                        'alias': 'snapdom'
                    }
                ],
                i = 0;

            this.render = function () {
                menuBtn = document.createElement('div');
                menuBtn.className = 'menu-btn unselectable';
                menuBtn.appendChild(document.createTextNode('\u250C'));

                menuList = document.createElement('ul');
                menuList.className = 'rg-menu';

                var menuItems = document.createDocumentFragment(),
                    li = document.createElement('li'),
                    liLink = document.createElement('a'),
                    liDesc = document.createElement('span'),
                    liHotKey = liDesc.cloneNode(false),
                    liDescTxt = document.createTextNode(''),
                    liHotKeyTxt = liDescTxt.cloneNode(false);

                liLink.href = 'javascript:';
                liDesc.className = 'desc';
                liHotKey.className = 'hotkey';

                for (i; i < menuItemsList.length; i = i + 1) {
                    li = li.cloneNode(false);
                    liLink = liLink.cloneNode(false);
                    liDesc = liDesc.cloneNode(false);
                    liHotKey = liHotKey.cloneNode(false);
                    liDescTxt = liDescTxt.cloneNode(false);
                    liHotKeyTxt = liHotKeyTxt.cloneNode(false);

                    /*不需要的功能暂时隐藏 start*/
                    li.className = menuItemsList[i].alias.match(/all|lock|open|save|snap|details|snapdom/ig) ? 'wqdruleos' : '';
                    /*不需要的功能暂时隐藏 end*/

                    liDescTxt.nodeValue = menuItemsList[i].text;
                    liHotKeyTxt.nodeValue = menuItemsList[i].hotkey;

                    liDesc.appendChild(liDescTxt);
                    liHotKey.appendChild(liHotKeyTxt);

                    liLink.appendChild(liDesc);
                    liLink.appendChild(liHotKey);

                    li.appendChild(liLink);

                    menuItems.appendChild(li);

                    toggles[menuItemsList[i].alias] = {
                        obj: liLink,
                        txt: liDescTxt
                    };
                }

              /*  evt.attach('mousedown', document.getElementById('visRuler'), function () {
                    if (rulerStatus === 1 || guideStatus === 1) {
                        rulerStatus = guideStatus = 1;
                        wrapper.style.display = 'none';
                    } else {
                        rulerStatus = guideStatus = 0;
                        wrapper.style.display = 'block';
                    }
                    toggleRulers();
                    toggleGuides();
                });*/

                evt.attach('mousedown', toggles.lock.obj, function () {
                    toggleRulersLock();
                });

                evt.attach('mousedown', toggles.clear.obj, function () {
                    deleteGuides();
                });

                evt.attach('mousedown', toggles.open.obj, function () {
                    openGridDialog.open();
                });

                evt.attach('mousedown', toggles.save.obj, function () {
                    saveGrid();
                });

                evt.attach('mousedown', toggles.snap.obj, function () {
                    snapDialog.open();
                });

                evt.attach('mousedown', toggles.details.obj, function () {
                    detailsStatus = 1 - detailsStatus;
                    showDetailedInfo();
                });

                evt.attach('mousedown', toggles.snapdom.obj, function () {
                    snapDom = 1 - snapDom;

                    if (snapDom === 1) {
                        domDimensions = calculateDomDimensions();
                    }
                });

                //menuList.appendChild(menuItems);

                //body.appendChild(menuBtn);
                //body.appendChild(menuList);

                evt.attach('mousedown', menuBtn, function () {
                    toggles.rulers.txt.nodeValue = (rulerStatus === 1)
                        ? '隐藏标尺刻度线'
                        : '显示标尺刻度线';

                    if (guidesCnt > 0) {
                        toggles.guides.obj.className = '';
                        toggles.clear.obj.className = '';
                        toggles.save.obj.className = '';

                        toggles.guides.txt.nodeValue = (guideStatus === 1)
                            ? '隐藏标尺'
                            : '显示标尺';
                    } else {
                        toggles.guides.obj.className = 'disabled';
                        toggles.clear.obj.className = 'disabled';
                        toggles.save.obj.className = 'disabled';
                    }

                    toggles.all.txt.nodeValue = (rulerStatus === 1 || guideStatus === 1)
                        ? 'Hide all'
                        : 'Show all';

                    toggles.lock.txt.nodeValue = (locked === 0) ? 'Lock rulers' : 'Unlock rulers';
                    toggles.details.txt.nodeValue = (detailsStatus === 0) ? 'Show detailed info' : 'Hide detailed info';
                    toggles.snapdom.txt.nodeValue = (snapDom === 0) ? 'Snap to DOM' : 'Turn off snap to DOM';
                    toggles.open.obj.className = (gridListLen > 0) ? '' : 'disabled';

                    menuList.style.display = (status === 0) ? 'inline-block' : 'none';

                    status = 1 - status;
                });
            };

            this.render();

            this.close = function () {
                if (menuList !== null) {
                    menuList.style.display = 'none';
                    status = 0;
                }
            };
        },
        SnapDialog = function () {
            var dialog = null,
                xInput = null,
                yInput = null,
                self   = this;

            this.render = function () {
                if (dialog === null) {
                    dialog = document.createElement('div');
                    xInput = document.createElement('input');
                    yInput = xInput.cloneNode(false);

                    var text = document.createTextNode(''),
                        okBtn = document.createElement('button'),
                        xLabel = document.createElement('label'),
                        titleBar = dialog.cloneNode(false),
                        dialogWrapper = dialog.cloneNode(false),
                        inputWrapper = dialog.cloneNode(false),
                        btnWrapper = dialog.cloneNode(false),
                        resetBtn = okBtn.cloneNode(false),
                        cancelBtn = okBtn.cloneNode(false),
                        yLabel = xLabel.cloneNode(false),
                        titleBarTxt = text.cloneNode(false),
                        xLabelTxt = text.cloneNode(false),
                        yLabelTxt = text.cloneNode(false),
                        okBtnTxt = text.cloneNode(false),
                        resetBtnTxt = text.cloneNode(false),
                        cancelBtnTxt = text.cloneNode(false);

                    titleBarTxt.nodeValue = 'Snap guides to';
                    xLabelTxt.nodeValue = 'X';
                    yLabelTxt.nodeValue = 'Y';
                    okBtnTxt.nodeValue = 'OK';
                    resetBtnTxt.nodeValue = 'Reset';
                    cancelBtnTxt.nodeValue = 'Cancel';

                    dialog.className = 'dialog snap-dialog';
                    titleBar.className = 'title-bar';
                    dialogWrapper.className = 'wrapper';

                    xLabel.className = 'rg-x-label';
                    xLabel.setAttribute('for', 'rg-x-snap');

                    yLabel.className = 'rg-y-label';
                    yLabel.setAttribute('for', 'rg-y-snap');

                    xInput.setAttribute('type', 'number');
                    xInput.value = '100';
                    xInput.id = 'rg-x-snap';

                    xInput.setAttribute('type', 'number');
                    yInput.value = '100';
                    yInput.id = 'rg-y-snap';

                    okBtn.className = 'ok-btn';
                    resetBtn.className = 'reset-btn';
                    cancelBtn.className = 'cancel-btn';

                    titleBar.appendChild(titleBarTxt);

                    xLabel.appendChild(xLabelTxt);
                    yLabel.appendChild(yLabelTxt);
                    okBtn.appendChild(okBtnTxt);
                    resetBtn.appendChild(resetBtnTxt);
                    cancelBtn.appendChild(cancelBtnTxt);

                    //inputWrapper.appendChild(xLabel);
                    //inputWrapper.appendChild(xInput);
                    //inputWrapper.appendChild(yLabel);
                    //inputWrapper.appendChild(yInput);
                    //inputWrapper.appendChild(resetBtn);

                    //btnWrapper.appendChild(okBtn);
                    //btnWrapper.appendChild(cancelBtn);

                    //dialogWrapper.appendChild(inputWrapper);
                    //dialogWrapper.appendChild(btnWrapper);

                    //dialog.appendChild(titleBar);
                    //dialog.appendChild(dialogWrapper);

                    //body.appendChild(dialog);

                    evt.attach('mousedown', okBtn, function () {
                        xSnap = parseInt(xInput.value, 10);
                        ySnap = parseInt(yInput.value, 10);

                        self.close();
                    });

                    evt.attach('mousedown', resetBtn, function () {
                        xSnap = 0;
                        ySnap = 0;
                        self.close();
                    });

                    evt.attach('mousedown', cancelBtn, function () {
                        self.close();
                    });
                }
            };

            this.render();

            this.open = function () {
                closeAllDialogs();

                dialog.style.display = 'block';
                dialog.style.left = ((doc.clientWidth - dialog.clientWidth) / 2) + 'px';
                dialog.style.top = ((doc.clientHeight - dialog.clientHeight) / 2) + 'px';
            };

            this.close = function () {
                dialog.style.display = 'none';
            };
        },
        prepare     = function () {
            var style = document.createElement('style'),
                size = getWindowSize(),
                elements = document.getElementsByTagName('*'),
                len = elements.length,
                i = 0;

            for (i; i < len; i = i + 1) {
                domElements.push(elements[i]);
            }

            style.setAttribute('type', 'text/css');

            if (style.styleSheet) {
                style.styleSheet.cssText = cssText;
            } else {
                style.appendChild(document.createTextNode(cssText));
            }
            /******************把cssText添加到HTML********************/
            //body.appendChild(style);

            setTimeout(function () {
                //hRuler = new Ruler('h', 3000);
                hRuler = new Ruler('h', 2000, getWindowSize());
                vRuler = new Ruler('v', 6);

                wrapper = document.createElement('div');
                gInfoBlockWrapper = wrapper.cloneNode(false);

                wrapper.className = 'rg-overlay';
                wrapper.id = 'rg-overlay';
                gInfoBlockWrapper.className = 'info-block-wrapper';

                wrapper.style.width = (size[0]) + 'px';
                wrapper.style.height = (size[1]) + 'px';

                wrapper.appendChild(hRuler);
                wrapper.appendChild(vRuler);
                wrapper.appendChild(gInfoBlockWrapper);

                body.appendChild(wrapper);

                domDimensions = calculateDomDimensions();

                menu = new Menu();
                snapDialog = new SnapDialog();
                openGridDialog = new OpenGridDialog();

                dialogs = [snapDialog, openGridDialog];
            }, 10);
        };

    prepare();

    this.status = 1;

    /*对外提供开启标尺刻度线 方法 start*/
    this.toggleRulers = toggleRulers;
    /*对外提供开启标尺刻度线 方法 end*/

    /*对外提供开启标尺 方法 start*/
    this.toggleGuides = toggleGuides;
    /*对外提供开启标尺 方法 end*/

    /*对外清除动画 方法 start*/
    this.deleteGuides = deleteGuides;
    /*对外清除动画 方法 end*/
    this.disable = function () {
        if (vRuler !== null) {
            deleteGuides();

            vRuler.style.display = 'none';
            hRuler.style.display = 'none';
            wrapper.style.display = 'none';
            menuBtn.style.display = 'none';
        }

        rulerStatus = 0;
        this.status = 0;
    };

    //ie检测
    function isIE() { //ie?
        if (!!window.ActiveXObject || "ActiveXObject" in window)
            return true;
        else
            return false;
    };
    //safri检测
    function isSafri() {
        var ua = navigator.userAgent.toLowerCase();
        return ua.match(/version\/([\d.]+)/) ? true : false;
    }
    //ff检测
    function isFf() {
        return navigator.userAgent.indexOf("Firefox")>0
    }
    this.enable = function () {
        if (vRuler !== null) {
            vRuler.style.display = 'block';
            hRuler.style.display = 'block';
            wrapper.style.display = 'block';
            menuBtn.style.display = 'block';
        }

        rulerStatus = 1;
        this.status = 1;
    };

    evt.attach('mousedown', document, function (e, src) {

        var x               = e.clientX,
            y               = e.clientY,
            guide           = null,
            guideInfo       = null,
            guideInfoText   = null,
            scrollPos       = getScrollPos(),
            snap            = 0,
            tempStr         = '';

        if(typeof src.className != "string") {
            tempStr = src.className.baseVal;
        } else {
            tempStr = src.className;
        }

        if (tempStr && tempStr.indexOf('menu-btn') === -1) {
            menu.close();
        }

        if (vBound === 0) {
            vBound = vRuler.offsetWidth;
            //hBound = hRuler.offsetHeight;
            /*横向刻度起始位置*/
            hBound = hRuler.offsetHeight + hPos;
        }

        if (
            /* (
             (x > vBound && y < hBound) ||
             (y > hBound && x < vBound)
             ) && rulerStatus === 1*//* 修改 */
        (
            (x < vPos+vBound && x > vPos && y > hPos) ||
            (y < hPos+hBound && y > hPos && x > vPos)
        ) && rulerStatus === 1
        ) {
            guide = document.createElement('div');
            guideInfo = guide.cloneNode(false);
            guideInfoText = document.createTextNode('');

            gUid = 'guide-' + guidesCnt;

            guideInfo.className = 'info';

            guideInfo.appendChild(guideInfoText);
            guide.appendChild(guideInfo);

            if (x > vBound && y > hPos && y < hBound) {
                //if (x > vBound && y < hBound) {
                guide.className = 'guide h draggable';
                guide.style.top = (e.clientY + scrollPos[0]) + 'px';
                guideInfo.style.left = (x + scrollPos[1] + 10) + 'px';
                guide.type = 'h';
                snap = ySnap;
                mode = 2;
            } else if (y > hBound && x < vBound+vPos && x > vPos) {//横向重新定义

                guide.className = 'guide v draggable';
                guide.style.left = (x + scrollPos[1]) + 'px';
                guideInfo.style.top = ((y + scrollPos[0]) - 35) + 'px';
                guide.type = 'v';
                snap = xSnap;
                mode = 1;
            }

            guide.id = gUid;
            guide.info = guideInfo;
            guide.text = guideInfoText;
            guide.x    = 0;
            guide.y    = 0;
            guides[gUid] = guide;
            wrapper.appendChild(guide);

            dragdrop.set(guide, {
                mode: mode,
                onstart: function (elem) {
                    var text = (elem.mode === 1)
                        ? parseInt(elem.style.left, 10) + 2
                        : parseInt(elem.style.top, 10) + 2;

                    if (elem.mode === 1) {
                        text = (parseInt(text)-3-yxj);
                        if(isIE()) text += 1;
                    } else {
                        text = (parseInt(text)-72);
                    }


                    elem.text.nodeValue = text + 'px';

                    if (elem.over !== undefined) {
                        evt.detach('mouseover', elem, elem.over);
                        evt.detach('mouseout', elem, elem.out);
                    }
                },
                onmove: function (elem) {
                    var text    = '',
                        pos     = 0,
                        dims    = [],
                        len     = 0,
                        i       = 0

                    pos = (elem.mode === 1) ? elem.style.left : elem.style.top;
                    pos = parseInt(pos, 10);

                    if (snapDom === 1) {
                        dims = domDimensions[elem.mode - 1];

                        for (i, len = dims.length; i < len; i = i + 1) {
                            if (pos <= dims[i]) {
                                pos = dims[i];
                                break;
                            }
                        }
                    }

                    text = pos + 'px';

                    if (elem.mode === 1) {
                        elem.style.left = (pos - 2) + 'px';
                        elem.x = pos;
                        text = (parseInt(pos)-3-yxj-10)+"px";
                        if(isIE()) text = (parseInt(pos)-2-yxj-10)+"px";
                    } else {
                        elem.style.top = (pos - 2) + 'px';
                        elem.y = pos;
                        text = (parseInt(pos)-(hBound+2))+"px";
                    }


                    elem.text.nodeValue = text;
                },
                onstop: function (elem) {
                    elem.over = evt.attach('mouseover', elem, function (e, src) {
                        if (src.className === 'guide v draggable') {
                            elem.info.style.top = ((e.clientY + scrollPos[0]) - 35) + 'px';
                        } else if (src.className === 'guide h draggable') {
                            elem.info.style.left = (e.clientX + scrollPos[1] + 10) + 'px';
                        }

                        elem.info.style.display = 'block';
                    });

                    elem.out = evt.attach('mouseout', elem, function () {
                        elem.info.style.display = 'none';
                    });
                    //在标尺内不显示，不在标尺内才显示
                    var xx = parseInt(elem.style.left), yy = parseInt(elem.style.top);
                    if((xx == 0 && yy < hBound) ||(yy == 0 && xx < vBound+vPos)){
                        elem.remove();
                        delete guides[gUid];
                        guidesCnt = guidesCnt - 1;
                    }
                },
                snap: snap
            });

            dragdrop.start(e, guide);

            guidesCnt = guidesCnt + 1;
        }
    });

    evt.attach('mouseup', document, function (e, src) {
        removeInboundGuide(src, src.id);

        if (detailsStatus === 1) {
            showDetailedInfo();
        }
    });

    evt.attach('keyup', document, function (e) {
        if (e.ctrlKey === true && e.altKey === true) {
            switch (e.keyCode) {
                case 83:
                    saveGrid();
                    break;
                case 82:
                    toggleRulers();
                    break;
                case 79:
                    openGridDialog.open();
                    break;
                case 76:
                    toggleRulersLock();
                    break;
                case 73:
                    detailsStatus = 1 - detailsStatus;
                    showDetailedInfo();
                    break;
                case 71:
                    toggleGuides();
                    break;
                case 69:
                    snapDom = 1 - snapDom;

                    if (snapDom === 1) {
                        domDimensions = calculateDomDimensions();
                    }
                    break;
                case 68:
                    deleteGuides();
                    break;
                case 67:
                    snapDialog.open();
                    break;
                case 65:
                    if (rulerStatus === 1 || guideStatus === 1) {
                        rulerStatus = guideStatus = 1;
                        wrapper.style.display = 'none';
                    } else {
                        rulerStatus = guideStatus = 0;
                        wrapper.style.display = 'block';
                    }

                    toggleRulers();
                    toggleGuides();

                    break;
            }
        }
    });

    evt.attach('resize', window, function () {
        var size = getWindowSize();

        wrapper.style.width = size[0] + 'px';
        wrapper.style.height = size[1] + 'px';

        if (resizeTimer !== null) {
            window.clearTimeout(resizeTimer);
        }

        if (snapDom === 1) {
            resizeTimer = window.setTimeout(function () {
                domDimensions = calculateDomDimensions();
            }, 100);
        }
    });
};
var _$winWidth = $(document.body).width()
function removeRuler() {
    if(_$winWidth != $(document.body).width()){
        _$winWidth = $(document.body).width()
        var rgOverlay = document.getElementById("rg-overlay");
        if(rgOverlay){
            document.body.removeChild(rgOverlay)
            $(".bst-mian-contnet").removeAttr('style')
        }else {
            return false
        }
    }

}

window.onresize = function () {
    removeRuler()
}
