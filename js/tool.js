(function(win){
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
    //获取身份证号码中的生日
    var fBrithByIdCard = function (idCard) {
        idCard = fTrim(idCard);
        if (idCard.length == 15) {
            var year = idCard.substring(6, 8);
            if (parseInt(year) < 10) {
                year = '20' + year;
            } else {
                year = '19' + year;
            }
            var month = idCard.substring(8, 10);
            var day = idCard.substring(10, 12);
        } else if (idCard.length == 18) {
            var year = idCard.substring(6, 10);
            var month = idCard.substring(10, 12);
            var day = idCard.substring(12, 14);
        }
        return year + "-" + month + "-" + day;
    }
    //获取身份证号码中的性别
    var fSexByIdCard = function (idCard) {
        idCard = fTrim(idCard);
        var sexMap = {0:"女",1:"男"};
        if (idCard.length == 15) {
            var sexStr =sexMap[idCard.substring(14, 15) % 2];
            // var sexStr = parseInt(idCard.substring(14, 1), 10) % 2 ? "男" : "女";
        } else if (idCard.length == 18) {
            var sexStr = sexMap[idCard.substring(14, 17) % 2];
            // var sexStr = parseInt(idCard.substring(17, 1), 10) % 2 ? "男" : "女";
        }
        return sexStr;
    }
    /*计算 n天之后的日期*/
    var gap = function (date, n) {
        var now = new Date(date);
        var next = disDate(now, n);
        var str = next.getFullYear() + "-" +toDouble(next.getMonth() + 1) + "-" + toDouble(next.getDate());
        return str;
        function disDate(oDate, iDate) {
            var ms = oDate.getTime();
            ms += iDate * 24 * 60 * 60 * 1000;
            return new Date(ms);
        }
    };
    /*获取当前日期*/
    var nowDate = function(){
        var nowTime=new Date();
        var nowYear = nowTime.getFullYear();
        var nowMonth =nowTime.getMonth() + 1;
        var nowDay = nowTime.getDate();
        var time=nowYear+'-'+validate.toDouble(nowMonth)+'-'+validate.toDouble(nowDay);
        return time;
    }
    /*将日期中的数字转为两位数*/
    var toDouble=function (val) {
        var len = val.toString().length;
        if (len < 2) {
            return '0' + val;
        } else {
            return val;
        }
    };
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
    //localStorage
    var setStorage = {
      set: function(key, val) {
        var storage = window.localStorage;
        if (key) {
          storage.setItem(key, val);
        }
      },
      get: function(key) {
        var storage = window.localStorage;
        if (key) {
          return storage.getItem(key);
        }
      },
      del: function(key) {
        var storage = window.localStorage;
        if (key) {
          storage.removeItem(key);
        }
      },
      clear: function() {
        var storage = window.localStorage;
        storage.clear();
      }
    };
    var validate = {};
    validate.idCard = fIdCardValidate;
    validate.sex = fSexByIdCard;
    validate.brith = fBrithByIdCard;
    validate.gap = gap;
    validate.toDouble = toDouble;
    validate.ages=Vali_ages;
    validate.setStorage=setStorage;
    validate.nowDate=nowDate;
    win.validate = validate;
}(window));