(function(){
    /*默认参数*/
    var defaults = {
        together : false, //默认遇错误打断，显示单条错误信息
        errShow : 'alert', //错误提示，默认为alert，支持字符串(alert,single,multiple),自定义function(string || array())
        errBox : 'error_strings', //错误消息class，默认为form表单中的 .error_strings
        errPar : 'li', //单个表单元素的父级元素，用于定位错误的位置 li > (span > input ) ~ span.error_strings
        timely : 1, //1:实时判断，是否失去焦点以及change判断,2:提交之后统一验证 ,3:点击提交按钮之后 变为实时验证
        jump : false, //是否定位到出错的地方,默认关闭
        startTime:'',
    };

    var nowTime=new Date();
    var nowYear = nowTime.getFullYear();
    var nowMonth =nowTime.getMonth() + 1;
    var nowDay = nowTime.getDate();
    var startTime=nowYear+'-'+nowMonth+'-'+nowDay;
    var numState = 0;
    var calDefault=function(){
    };
    //公用方法
    var Common = {
        /*对象扩展*/
        extend : function (from,to){
            var i, obj = {};
            for(i in from){
                obj[i] = to[i] ? to[i] : from[i];
            };
            return obj;
        },
        /*遍历数组或者对象---为每个匹配元素规定运行的函数*/
        each : function (obj,fn) {
            var ret;
            if(obj.constructor === Array){
                for(var i = 0; i < obj.length; i += 1) {
                    ret= fn(i,obj[i]);
                    if(ret === false){
                        return false;
                    }
                };
            }else if(typeof obj === 'object'){
                for(var i in obj){
                    ret = fn(i,obj[i]);
                    if(ret === false){
                        return false;
                    }
                };
            }
        },
        /*在数组中查找指定值---存在返回true*/
        inArray : function (val,arr) {
            var i = 0, len = arr.length, o = {};
            for( ; i < len; i += 1) {
                o[arr[i]] = true;
            };
            return o[val];
        },
        /*返回指定class*/
        hasClass : function (element,value) {
            var reg = new RegExp('(\\s|^)' + value + '(\\s|$)');
            return element.className.match(reg);
        },
        /*指定元素之后插入新元素*/
        insertAfter : function(newChild,refChild){
            var parElem=refChild.parentNode;
            if(parElem.lastChild==refChild){
                refChild.appendChild(newChild);
            }else{
                parElem.insertBefore(newChild,refChild.nextSibling);
            }
        },
        /*返回top值*/
        getPosTop : function (obj) {
            //obj.offsetParent:最近的祖先定位元素
            //arguments.callee()指向当前正在执行的函数
            return obj.offsetParent ? (obj.offsetTop + arguments.callee(obj.offsetParent)) : obj.offsetTop;
        },
        /*返回指定标签的父级元素*/
        getParent : function (obj,tagname){
            return obj.parentNode.tagName == tagname ? obj.parentNode : arguments.callee(obj.parentNode,tagname);
        },
        /*获取指定class的元素*/
        getErrBox : function (obj,tagname,classname) {
            var boxList = obj.getElementsByTagName(tagname), i = 0, len = boxList.length, ret;
            if(len > 0){
                for ( ; i < len; i += 1){
                    if(Common.hasClass(boxList[i],classname)) {
                        ret = boxList[i];
                        return ret;
                    }
                };
            }
            if(ret){
                return ret;
            }else{
                var elem = document.createElement(tagname);
                elem.className = classname;
                //Common.insertAfter(elem,obj);
                obj.appendChild(elem);
                return elem;
            }
        },
        /*填充错误html*/
        addMsg : function (obj,msg) {
            obj.style.display = 'inline-block';
            obj.innerHTML = msg;
            obj.className='error_strings';
        },
        /*向指定元素添加事件句柄*/
        bind : (function() {
            if (window.addEventListener) {
                return function(el, type, fn, identifier) {
                    el.bindFn = el.bindFn || {};
                    el.bindFn[identifier] = {
                        eventType : type,
                        eventFn : fn
                    }
                    el.addEventListener(type, fn, false);
                };
            } else if (window.attachEvent) {//IE
                return function(el, type, fn, identifier) {
                    el.bindFn = el.bindFn || {};
                    el.bindFn[identifier] = {
                        eventType : type,
                        eventFn : fn
                    }
                    el.attachEvent("on" + type, fn);
                };
            }
        })(),
        /*向指定元素删除事件句柄*/
        unbind : (function(){
            if (window.addEventListener) {
                return function(el, identifier ) {
                    if(identifier){
                        if(el.bindFn && el.bindFn[identifier]){
                            var fn = el.bindFn[identifier]['eventFn'], type = el.bindFn[identifier]['eventType'];
                            el.removeEventListener(type, fn);
                        }
                    }else{
                        var key;
                        for(key in el.bindFn){
                            el.removeEventListener(el.bindFn[key]['eventType'], el.bindFn[key]['eventFn']);
                        }
                    };
                };
            } else if (window.attachEvent) {
                return function(el, identifier) {
                    if(identifier){
                        if(el.bindFn[identifier]){
                            var fn = el.bindFn[identifier]['eventFn'], type = el.bindFn[identifier]['eventType'];
                            el.detachEvent("on" + type, fn);
                        };
                    }else{
                        var key;
                        for(key in el.bindFn){
                            el.detachEvent("on" + el.bindFn[key]['eventType'], el.bindFn[key]['eventFn']);
                        }
                    }
                };
            }
        })(),
        //是否为空的判断--空返回true
        isEmpty : function (value) {
            value = value.replace(/(^\s*)|(\s*$)/g,"");
            return (value.length) == 0 ? true : false;
        }
    };

    var Validator = function (frmname,options,calBack) {
        if( !(this instanceof Validator) ) {
            return new Validator(frmname,options,calBack);
        }

        this.options = Common.extend(defaults,options);
        this.calBack=calBack||calDefault;

        /*获取验证的表单*/
        this.formobj = document.forms[frmname];
        if(!this.formobj){
            console.log("找不到表单" + frmname);
            return false;
        }
        /*计算年龄的生效日期*/
        if(this.options.startTime){
            startTime=this.options.startTime;
        }
        this.init();
    }
    /*使用prototype添加属性*/
    Validator.fn = Validator.prototype;
    //初始化
    Validator.fn.init = function (options) {
        var self = this, formobj = this.formobj;
        if(options){
            self.hideError();
            self.options = Common.extend(defaults,options);
        }else{
            /*表单提交*/
            formobj.oldSubmit = null; //原始方法
            if( formobj.onsubmit ){
                formobj.oldSubmit = formobj.onsubmit;
                formobj.onsubmit = null;
            }
            // var numState=0;
            // formobj.onsubmit = function () {
            //     console.log(555);
            //     numState++;
            //     if(self.checkForm()){
            //         self.showError();
            //         if(numState==1 && +self.options.timely==3){
            //             self.ruleData.forEach(function(params){
            //                 self.timeBind(params);
            //             })
            //         }
            //         return false;
            //     }else{
            //         if(formobj.oldSubmit){
            //             return formobj.oldSubmit();
            //         }else{
            //             self.calBack();
            //             // return true;
            //             return false;
            //         }
            //     }
            // };

            /*初始化数据*/
            self.ruleData = []; //缓存验证规则
            self.errObjList = {}; //缓存显示错误的obj对象

            self.errorHash = {}; //缓存错误的，哈希表
            self.errorArray = []; //缓存错误的，数组
            self.errorFnArray = [];//缓存执行错误的function

            self.jump = true; //定位到错误开关
        }
    }
    //触发验证
    Validator.fn.toTrigger = function(){
        var self = this;
        numState++;
        console.log(self.checkForm());
        if(self.checkForm()){
            self.showError();
            if(numState==1 && +self.options.timely==3){
                self.ruleData.forEach(function(params){
                    self.timeBind(params);
                })
            }
            return false;
        }else{
            self.calBack();
            return false;
        }
    }
    /*重置验证规则*/
    Validator.fn.resetRule = function (rules) {
        var self = this;
        self.ruleData = [];
        self.errorArray = [];
        self.errorFnArray = [];
        self.errorHash = {};
        self.addRule(rules);
    }
    /*添加验证规则*/
    Validator.fn.addRule = function (rules) {
        var self = this;
        if(rules.constructor === Array){
            if(rules[0].constructor === Array){
                //如果是二维数组
                Common.each(rules,function(key,value){
                    self.initRule(value);
                });
            }else{
                //如果是一维数组
                self.initRule(rules);
            }
        }
        return self;
    }
    Validator.fn.removeRule = function (rules) {
        var self = this, itemname, rulename, itemArray = [], obj, index;
        if(rules.constructor === Array){
            if(rules[0].constructor === Array){
                //如果是二维数组
                for(var i = 0; i < rules.length; i += 1){
                    itemname = rules[i][0];
                    rulename = rules[i][1];
                    self.removeRuleFn(itemname,rulename);
                }
            }else{
                //如果是一维数组
                itemname = rules[0], rulename = rules[1];
                self.removeRuleFn(itemname,rulename);
            }
        }else if(typeof rules === 'string'){
            self.removeRuleFn(rules);
        }
    }
    Validator.fn.removeRuleFn = function (itemname, rulename) {
        var self = this;
        if(rulename){
            for(var j = 0; j < self.ruleData.length; j += 1){
                if(self.ruleData[j].name == itemname && self.ruleData[j].rule == rulename){
                    if(+self.options.timely==1)Common.unbind(self.ruleData[j].obj,rulename);
                    self.ruleData.splice(j,1);
                    return false;
                }
            }
        }else{
            var j = self.ruleData.length;
            while(j > 0){
                j -= 1;
                if(self.ruleData[j].name == itemname){
                    if(+self.options.timely==1)Common.unbind(self.ruleData[j].obj);
                    self.ruleData.splice(j,1);
                }
            }
        }
    };
    Validator.fn.destory = function () {
        var self = this;
        var inputList = self.formobj.getElementsByTagName('input'), selectList = self.formobj.getElementsByTagName('select'), textareaList = self.formobj.getElementsByTagName('textarea');
        for (var i = 0; i < inputList.length; i += 1){
            Common.unbind(inputList[i]);
        };
        for (var i = 0; i < selectList.length; i += 1){
            Common.unbind(selectList[i]);
        };
        for (var i = 0; i < textareaList.length; i += 1){
            Common.unbind(textareaList[i]);
        }
        self.formobj.oldSubmit = null;
        self.formobj.onsubmit = null;
        // self.init();
    }
    Validator.fn.initRule = function (value) {
        var self = this, pos, rule, ruleExt, itemname, itemobj, data = {};
        itemname = value[0]; //获取表单的name值
        itemobj = self.formobj[itemname]; //获取itemname对象
        if(!itemobj){
            return false;
        }
        //判断rule是否有扩展值
        pos = value[1].search('=');
        if(pos >= 0){
            rule = value[1].substring(0,pos);
            ruleExt = value[1].substr(pos + 1);
            if(rule != 'regex'){
                ruleExt = isNaN(ruleExt) ? ruleExt : parseInt(ruleExt);
                if(/^('|")\w+/.test(ruleExt)){
                    ruleExt = ruleExt.replace(/^('|")|('|")$/g,'').split('|');
                }
            }
        }else{
            rule = value[1];
            ruleExt = undefined;
        }
        data = {
            name: itemname,
            obj : itemobj,
            rule : rule,
            ruleExt : ruleExt !== false ? ruleExt : '',
            msg : value[2] || ''
        }
        self.ruleData.push(data);
        if(+self.options.timely==1){
            //如果开启实时验证
            (function(params){
                // msg:"请输入姓名"
                // name:"i_name"
                // obj:input#i_name.common_input
                // rule:"required"
                // ruleExt:undefined
                self.timeBind(params);
            })(data);
        };
    }
    Validator.fn.timeBind = function(params){
        var self = this,itemobj= params.obj;
        if(itemobj.length > 0){
            itemobj.tagName == 'SELECT' ? (function(){
                Common.bind(itemobj,'change',function(){
                    self.checkSingle(params,true);
                    self.checkError(params);

                },params.rule);
            })() :
                (function(){
                    for(var i = 0; i < itemobj.length; i += 1){
                        (function(j){
                            Common.bind(itemobj[j],'click',function(){
                                self.checkSingle(params,true);
                                self.checkError(params);
                            },params.rule);
                        })(i);
                    };
                })();
        }else{
            // Common.bind(itemobj,'input',function(){
            //     self.checkSingle(params,true);
            //     self.checkError(params);
            //     self.hideError(params.name,params);
            // },params.rule);
            Common.bind(itemobj,'focus',function(){
                self.checkSingle(params,true);
                self.checkError(params);
                self.hideError(params.name,params);
            },params.rule);
            Common.bind(itemobj,'change',function(){
                self.checkSingle(params,true);
                self.checkError(params);
            },params.rule);
        }
    }
    Validator.fn.checkForm = function () {
        var self = this;
        self.errorHash = {}; //缓存错误的，哈希表
        self.errorArray = []; //缓存错误的，数组
        self.hideError(); //隐藏错误
        Common.each(self.ruleData,function(key,value){
            if(self.options.together){
                //如果检测所有错误
                self.checkSingle(value);
            }else{
                if(self.errorArray.length < 1){
                    self.checkSingle(value);
                }else{
                    return false;
                }
            }
        });
        return self.errorArray.length > 0 ? true : false ;
    }

    Validator.fn.checkSingle = function(data,single) {
        var self = this;
        if(!Commands.call(self,data)){
            //如果验证没有通过，将这条记录缓存到错误列表
            if(!self.errorHash[data.name]){
                var len = self.errorArray.push(data);
                self.errorHash[data.name] = len;
            }
            data.single=false;
            window._data=data;
        }else{
            /*
             * 验证通过
             * 单独验证
             * */
            var res = false, len = self.errorHash[data.name];
            data.single=true;
            window._data=data;
            if(single && len > 0){
                //验证逻辑，错误rule == 传参rule , 删除该记录
                Common.each(self.errorArray,function(key,value){
                    if(value['name'] == data.name){
                        if(self.errorArray[key]['rule'] == data.rule){
                            self.errorArray.splice(key,1);
                            self.errorHash[data.name] = false;
                            return false;
                        }
                    }
                });

            }
        }

    }
    Validator.fn.showError = function () {
        var self = this, msgArray = [], split;
        if(typeof self.options.errShow == 'function'){
            //如果错误形式为函数的话，直接返回错误数组
            self.options.errShow(self.errorArray);
        }else{
            switch(self.options.errShow){
                case 'alert':
                case 'multiple':
                    Common.each(self.errorArray,function(key,value){
                        if(typeof value.msg == 'string'){
                            msgArray.push(value.msg);
                        }else if(typeof value.msg == 'function'){
                            value.msg();
                        }
                    });
                    if(self.options.errShow == 'alert'){
                        if(msgArray.length > 0){
                            alert(msgArray.join('\n'));
                        }
                    }else{
                        self.showErrorBox(self.formobj,msgArray.join('<br/>'));
                    }
                    break;
                case 'single':
                    Common.each(self.errorArray,function(key,value){
                        if(self.jump && self.options.jump){
                            //是否支持跳转
                            var y = Common.getPosTop(value.obj) - 10;
                            scrollTo(0,y);
                            self.jump = false; //只能跳转一次
                        };
                        if(typeof value.msg == 'string'){
                            self.showErrorSingle(value);
                        }else if(typeof value.msg == 'function'){
                            value.msg();
                        }
                    });
                    self.jump = true; //恢复
                    break;
            }
        }
    }
    Validator.fn.showErrorSingle = function (data){
        var self = this, obj = data.obj, msg = data.msg, name = data.name;
        if(!self.errObjList[name]){
            if(obj.tagName != 'SELECT' && obj.length){
                obj = obj[obj.length-1];
            }
            obj = Common.getParent(obj,self.options.errPar.toUpperCase());
            self.errObjList[name] = Common.getErrBox(obj,'span',self.options.errBox);
        }
        if(typeof msg == 'string'){
            var curInput=document.getElementsByName(name)[0];
            curInput.style.borderColor=' #f00';
            Common.addMsg(self.errObjList[name],msg);
        }else if(typeof msg == 'function'){
            msg();
        }
    }
    Validator.fn.showErrorBox = function (obj,msg) {
        var self = this, divList = obj.parentNode.getElementsByTagName('div');
        if(self.errGlobalObj){
            self.errGlobalObj.innerHTML = msg;
            self.errGlobalObj.style.display = 'block';
        }else{
            for(var i = 0; i < divList.length; i += 1){
                if(Common.hasClass(divList[i],self.options.errBox)){
                    self.errGlobalObj = divList[i];
                    Common.addMsg(self.errGlobalObj,msg);
                    return false;
                }
            };
            if(!self.errGlobalObj){
                self.errGlobalObj = document.createElement('div');
                self.errGlobalObj.className = self.options.errBox;
                self.errGlobalObj.innerHTML = msg;
                self.errGlobalObj.style.display = 'block';
                Common.insertAfter(self.errGlobalObj,obj);
            }
        }
    }
    Validator.fn.checkError = function (data) {
        var self = this, len = self.errorHash[data.name];
        //self.hideError(data.name,data);
        if(self.errGlobalObj){
            self.errGlobalObj.style.display = 'none';
        }
        if(len > 0){
            Common.each(self.errorArray,function(key,value){
                if(value['name'] == data.name){
                    if(self.errorArray[key]['rule'] == data.rule){
                        self.showErrorSingle(self.errorArray[key]);
                        return false;
                    }
                }
            });

        }else{
            self.hideError(data.name,data);
        }
    }
    Validator.fn.hideError = function (objName,data) {
        var self = this;
        if(objName){
            if(self.errObjList[objName]){
                var curInput=document.getElementsByName(objName)[0];
                curInput.style.borderColor='#00c0ff';
                self.errObjList[objName].style.display = 'none';
                setTimeout(function(){
                    if(data && data.single){
                        data.obj.setAttribute('style','');
                    }
                },100)
            }
            return false;
        }
        if(self.errGlobalObj){
            self.errGlobalObj.style.display = 'none';
        }
        if(self.errObjList){
            Common.each(self.errObjList,function(key,value){
                var curInput=document.getElementsByName(key)[0];
                curInput.style.borderColor='#d1d1d1';
                value.style.display = 'none';
            });
        }
    };


    //command验证规则，进行非空的验证。如果为空不验证
    var Commands = function (data) {
        var method = data.rule;
        data.obj.value=fTrim(data.obj.value);
        switch (method) {
            /*大于/小于传进来的日期*/
            case "lessDate":
            case "greaterDate":
                var a=getDateDiff(data.ruleExt,data.obj.value).toString();
                return method == 'lessDate' ? parseInt(a) < 0 : parseInt(a) > 0;
               break;
            break
            /*组织机构代码证9位--18位*/
            case 'organizationcode' :
                var val=data.obj.value.toString();
                return val? /^\w{8}-\w{1}$|^\w{18}$/.test(val) : false;
                break;
            /*中文*/
            case 'chinese':
                return Common.isEmpty(data.obj.value) ? true : /[\u4e00-\u9fa5]/.test(data.obj.value);
                break;
            /*座机号码*/
            case 'newtel' :
                var val=data.obj.value.toString()
                return data.obj.value?/^\d{3,4}-\d{7,8}$/.test(val):false;
                break;
            /*身份证*/
            case 'idcard' :
                return Common.isEmpty(data.obj.value) ? true:fIdCardValidate(data.obj.value);
                break;
            case 'required' :
                return Common.isEmpty(data.obj.value) ? false : true ;
                break;
            case 'required' :
                return Common.isEmpty(data.obj.value) ? false : true ;
                break;
            case 'maxlength' :
                return Common.isEmpty(data.obj.value) ? true : data.obj.value.length <= data.ruleExt ;
                break;
            case 'equallength' :
                return Common.isEmpty(data.obj.value) ? true : data.obj.value.length == data.ruleExt ;
                break;
            case 'minlength' :
                return Common.isEmpty(data.obj.value) ? true : data.obj.value.length >= data.ruleExt ;
                break;
            case 'number' :
                return Common.isEmpty(data.obj.value) ? true : /^[\d]+$/.test(data.obj.value);
                break;
            case 'alpha' :
                return Common.isEmpty(data.obj.value) ? true : /^[A-Za-z]+$/.test(data.obj.value);
                break;
            case 'string' :
                return Common.isEmpty(data.obj.value) ? true : /^\w+$/.test(data.obj.value);
                break;
            case 'email' :
                return Common.isEmpty(data.obj.value) ? true : /\w+((-w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]{2,}/.test(data.obj.value);
                break;
            case 'telephone' :
                // return Common.isEmpty(data.obj.value) ? true : /^((13[0-9])|(15[0-9])|(18[0-9])|(17[0-9])|(14[0-9]))\d{8}$/.test(data.obj.value);
                return Common.isEmpty(data.obj.value) ? true : /^(((1[3|4|5|7|8|9]{1}[0-9]{1}))[0-9]{8})$/.test(data.obj.value);
                break;
            case 'bothtel' :
                return Common.isEmpty(data.obj.value) ? true : /^(((1[3|4|5|7|8|9]{1}[0-9]{1}))[0-9]{8})$|^\d{3,4}-\d{7,8}$/.test(data.obj.value);
                break;
            case 'mobile' :
                return Common.isEmpty(data.obj.value) ? true : /^(^0\d{2}-?\d{8}$)|(^0\d{3}-?\d{7}$)|(^\(0\d{2}\)-?\d{8}$)|(^\(0\d{3}\)-?\d{7}$)$/.test(data.obj.value);
                break;
            case 'url' :
                var regex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
                return regex.test(data.obj.value);
                break;
            case 'lessthan' :
            case 'greaterthan' :
                var a=data.obj.value;
                if(data.obj.name=='birthday'){
                    a=Vali_ages(a,startTime||new Date()).toString();
                }
                var compare = typeof data.ruleExt == 'number' ? data.ruleExt : parseInt(this.formobj[data.ruleExt].value);
                return method == 'lessthan' ? parseInt(a) <= compare : parseInt(a) >= compare;
                break;
            case 'greaterthanDate' :
                var a=data.obj.value;
                if(data.obj.name=='i_birthday'||data.obj.name=='p_birthday'){
                    a=getDateDiff(a,startTime).toString();
                }
                var compare = typeof data.ruleExt == 'number' ? data.ruleExt : parseInt(this.formobj[data.ruleExt].value);
                return method == 'lessthan' ? parseInt(a) <= compare : parseInt(a) >= compare;
                break;
            case 'equal' :
            case 'unequal' :
                var val = data.obj.value, ext = data.ruleExt, self = this;
                return typeof ext == 'number' ?
                    (function(){
                        return method == 'equal' ? parseInt(val) == ext : parseInt(val) != ext ;
                    })() :
                    (function(){
                        if(ext.constructor === Array){
                            return method == 'equal' ? Common.inArray(val,ext) : !Common.inArray(val,ext);
                        }else{
                            return method == 'equal' ? val == self.formobj[ext].value : val != self.formobj[ext].value ;
                        }
                    })();
                break;
            case 'notselect' :
                return data.obj.tagName == 'SELECT' ? (function(){
                    var index = data.obj.selectedIndex;
                    return data.obj.options[index].value != data.ruleExt;
                })() :
                    (function(){
                        var objArr = data.obj, ret = true;
                        if (objArr.length){
                            if(data.ruleExt && data.ruleExt.constructor === Array){
                                checklen = data.ruleExt.length;
                                for (var i = 0; i < objArr.length; i += 1) {
                                    if (objArr[i].checked == true && Common.inArray(objArr[i].value,data.ruleExt)){
                                        ret = false;
                                        return false;
                                    }
                                };
                            }else{
                                for (var i = 0; i < objArr.length; i += 1) {
                                    if (objArr[i].checked == true){
                                        if(data.ruleExt === undefined){
                                            ret = false;
                                            return false;
                                        }else if(objArr[i].value == data.ruleExt){
                                            ret = false;
                                            return false;
                                        }
                                    }
                                };
                            }
                        }else{
                            if (objArr.checked == true){
//                        objArr.value == data.ruleExt 一个对象时，是否判断是否等于设置的值
                                ret = false;
                            }
                        }

                        return ret;
                    })();
                break;
            case 'shouldselect' :
                var objArr = data.obj, ret = false, checklen = 0, retNum = 0;
                if (objArr.length){
                    if(data.ruleExt && data.ruleExt.constructor === Array){
                        checklen = data.ruleExt.length;
                        for (var i = 0; i < objArr.length; i += 1) {
                            if (objArr[i].checked == true && Common.inArray(objArr[i].value,data.ruleExt)){
                                retNum += 1;
                            }
                        };
                        ret = (checklen === retNum)?true:false;
                    }else{
                        for (var i = 0; i < objArr.length; i += 1) {
                            if (objArr[i].checked == true){
                                if(data.ruleExt === undefined){
                                    ret = true;
                                }else if(objArr[i].value == data.ruleExt){
                                    ret = true;
                                }
                            }
                        };
                    }
                }else{
                    if (objArr.checked == true){
                        ret = true;
                    }
                }
                return ret;
                break;
            case 'minselect' :
            case 'maxselect' :
                var objArr = data.obj, checklen = 0;
                if(objArr.length){
                    for(var i = 0; i < objArr.length; i += 1) {
                        if(objArr[i].checked == true) {
                            checklen += 1;
                        }
                    };
                }else{
                    if (objArr.checked == true){
                        checklen += 1;
                    }
                }
                return method == 'minselect' ?  checklen >= data.ruleExt : checklen <= data.ruleExt ;
                break;
            default :
                return false;
                break;
        }
    }
    window.Validator = Validator;

    //身份证验证
    var gWi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];    // 加权因子
    var gValideCode = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];            // 身份证验证位值.10代表X
    var fIdCardValidate = function(idCard) {
        idCard = fTrim(idCard.replace(/(^\s*)|(\s*$)/g, ""));               //去掉字符串头尾空格
        if (idCard.length == 15) {
            return fIsValidityBrithBy15IdCard(idCard);       //进行15位身份证的验证
        } else if (idCard.length == 18) {
            var arrIdCard = idCard.split("");                // 得到身份证数组
            if(fIsValidityBrithBy18IdCard(idCard) && fIsTrueValidateCodeBy18IdCard(arrIdCard)){   //进行18位身份证的基本验证和第18位的验证
                return true;
            }else {
                return false;
            }
        } else {
            return false;
        }
    }
    /**
     * 判断身份证号码为18位时最后的验证位是否正确
     * @param arrIdCard 身份证号码数组
     * @return
     */
    var fIsTrueValidateCodeBy18IdCard = function(arrIdCard) {
        var sum = 0;                             // 声明加权求和变量
        if (arrIdCard[17].toLowerCase() == 'x') {
            arrIdCard[17] = 10;                    // 将最后位为x的验证码替换为10方便后续操作
        }
        for ( var i = 0; i < 17; i++) {
            sum += gWi[i] * arrIdCard[i];            // 加权求和
        }
        valCodePosition = sum % 11;                // 得到验证码所位置
        if (arrIdCard[17] == gValideCode[valCodePosition]) {
            return true;
        } else {
            return false;
        }
    }
    /**
     * 验证18位数身份证号码中的生日是否是有效生日
     * @param idCard 18位书身份证字符串
     * @return
     */
    var fIsValidityBrithBy18IdCard = function(idCard18){
        var year =  idCard18.substring(6,10);
        var month = idCard18.substring(10,12);
        var day = idCard18.substring(12,14);
        var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));
        // 这里用getFullYear()获取年份，避免千年虫问题
        if(temp_date.getFullYear()!=parseFloat(year)
            ||temp_date.getMonth()!=parseFloat(month)-1
            ||temp_date.getDate()!=parseFloat(day)){
            return false;
        }else{
            return true;
        }
    }
    /**
     * 验证15位数身份证号码中的生日是否是有效生日
     * @param idCard15 15位书身份证字符串
     * @return
     */
    var fIsValidityBrithBy15IdCard = function(idCard15){
        var year =  idCard15.substring(6,8);
        var month = idCard15.substring(8,10);
        var day = idCard15.substring(10,12);
        var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));
        // 对于老身份证中的你年龄则不需考虑千年虫问题而使用getYear()方法
        if(temp_date.getYear()!=parseFloat(year)
            ||temp_date.getMonth()!=parseFloat(month)-1
            ||temp_date.getDate()!=parseFloat(day)){
            return false;
        }else{
            return true;
        }
    }
    //去掉字符串头尾空格
    var fTrim = function(str) {
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }
    //获取年龄
    var Vali_ages = function jsGetAge(str, effectTime) {
        var r = str.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
        var e = effectTime.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
        if (r == null ||e == null)return false;
        var returnAge;
        var d = new Date(r[1], r[3] - 1, r[4]);
        var birthYear = d.getFullYear();
        var birthMonth = d.getMonth() + 1;
        var birthDay =d.getDate();
        var now = new Date(e[1], e[3] - 1, e[4]);
        var nowYear = now.getFullYear();
        var nowMonth =now.getMonth() + 1;
        var nowDay = now.getDate();
        if (birthYear == r[1] && birthMonth== r[3]) {
            if (nowYear == birthYear) {
                returnAge = 0;
                return returnAge ;
            }
            else {
                var ageDiff = nowYear - birthYear; //年之差
                if (ageDiff > 0) {
                    if (nowMonth == birthMonth) {
                        var dayDiff = nowDay - birthDay;//日之差
                        if (dayDiff < 0) {
                            returnAge = ageDiff - 1;
                        }
                        else {
                            returnAge = ageDiff;
                        }
                    } else {
                        var monthDiff = nowMonth - birthMonth;//月之差
                        if (monthDiff < 0) {
                            returnAge = ageDiff - 1;
                        }
                        else {
                            returnAge = ageDiff;
                        }
                    }
                }
                else {
                    returnAge = -1;//返回-1 表示出生日期输入错误 晚于今天}
                }
                return returnAge;//返回周岁年龄
            }
        }
    }
    //获取出生天数
    var getDateDiff = function (date2,effectTime) {
        var d1 = new Date(effectTime.replace(/-/g, "/"));
        var d2 = new Date(date2.replace(/-/g, "/"));
        var diff = parseInt((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
        return diff;
    }
})();
