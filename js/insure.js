$(function() {
  var F, //验证规则
    ages_range = [18, 75], //允许投保的年龄范围
    nowDate = validate.nowDate(), //当前时间
    sendtype = true,
    personInfo = {
      //被保险人信息（名字，城市，身份证,性别，出生日期，保险生效日期，保险结束日期）
      name: "",
      city: "",
      city_val: "",
      idCard: "",
      sex: "",
      birthday: "",
      starttime: validate.gap(nowDate, 1),
      endtime: validate.gap(nowDate, 357),
      mobile: "",
      isChecked: true
    };
  //从缓存中获取已经填写的信息
  if (validate.setStorage.get("personInfo")) {
    personInfo = JSON.parse(validate.setStorage.get("personInfo"));
    validate.setStorage.del("personInfo");
  }
  personInfo.starttime = validate.gap(nowDate, 1);
  personInfo.endtime = validate.gap(nowDate, 357);
  $("#name").val(personInfo.name);
  $("#cardId").val(personInfo.idCard);
  $("#city_model").html(personInfo.city || "请选择");
  $("#city_name").val(personInfo.city);
  $("#city_val").val(personInfo.city_val);
  if(personInfo.mobile){
    var countdown = $(".countdown");
    var reg = {
      mobile: /^1[3|4|5|7|8]\d{9}$/,
    };
    $("#tel").val(personInfo.mobile);
    reg.mobile.test(personInfo.mobile)&&!countdown.hasClass("active") && countdown.addClass("active");
  }
  validcardId(); //通过身份证获取出生日期 与性别
  selectCity(); //设置省市插件
  vallidform(); //添加验证规则

  //选择学车城市并缓存
  $("#city_name").focus(function(event) {
    personInfo.city = $("#city_name").val();
    personInfo.city_val = $("#city_val").val();
    setStorage();
  });
  /*填写姓名并缓存*/
  $("#name").change(function(event) {
    personInfo.name = $("#name").val();
    setStorage();
  });
  //填写身份证并缓存
  $("#cardId").change(function(event) {
    validcardId();
  });
  //填写手机号并缓存
  $("#tel").bind('input propertychange',function(event) {
    personInfo.mobile = $("#tel").val();
    var countdown = $(".countdown");
    var reg = {
      mobile: /^1[3|4|5|7|8]\d{9}$/,
    };
    if(reg.mobile.test(personInfo.mobile)){
      !countdown.hasClass("active") && countdown.addClass("active");
    }else{
      countdown.removeClass("active");
    }
    setStorage();
  });

  //立即支付---执行验证规则
  $(".footer_pay").click(function(event) {
    F.toTrigger();
  });

  //通过身份证添加出生日期 与性别
  function validcardId() {
    var val = $("#cardId").val();
    if (validate.idCard(val)) {
      var sex = validate.sex(val) == "男" ? "1" : "2",
        birthday = validate.brith(val);
      personInfo.idCard = val;
      personInfo.sex = sex;
      personInfo.birthday = birthday;
      setStorage();
    }
  }
  /*添加验证规则*/
  function vallidform() {
    F = Validator(
      "infoForm",
      {
        errPar: "li",
        together: true,
        errShow: "single",
        timely: 3
      },
      function() {
        //前端验证通过之后提交数据到后台
        confirmsForm();
      }
    );
    //添加验证规则
    F.addRule([
      ["city", "required", "请选择学车城市"],
      ["name", "required", "请输入姓名"],
      ["name", "chinese", "请输入中文"],
      ["name", "minlength=2", "请输入正确的姓名"],
      ["cardId", "required", "请输入身份证号"],
      ["cardId", "idcard", "请输入正确的身份证号"],
      ["cardId", "equallength=18", "请输入18位身份证号"],
      ["tel", "required", "请输入手机号码"],
      ["tel", "telephone", "请输入正确的手机号码"],
      ["verifyCode", "required", "请输入验证码"]
    ]);
  }

  //前端验证通过之后-------------------------------------------------------------------------提交数据
  function confirmsForm() {
    if (!$("#clausetrue").hasClass("active")) {
      $(".dialogs").css("display", "block");
      $(".dialogs_content")
        .removeClass("MoveHide")
        .addClass("MoveShow");
      $(".dialogs_text").html("请阅读并同意驾考尊享服务协议");
      return;
    }
    if (!toJudgeAge()) return; //未在投保的规定年龄范围
    //提交数据-------
  }

  //判定年龄是否符合规定
  function toJudgeAge() {
    var starttime = personInfo.starttime;
    var age = validate.ages(personInfo.birthday, personInfo.starttime);
    if (age < ages_range[0] || age > ages_range[1]) {
      $(".dialogs").css("display", "block");
      $(".dialogs_content")
        .removeClass("MoveHide")
        .addClass("MoveShow");
      $(".dialogs_text").html(
        "年龄超出" + ages_range[0] + "岁至" + ages_range[1] + "岁的保障范围"
      );
      return false;
    } else {
      return true;
    }
  }
  /*弹出框的确定按钮*/
  $(".dialogs_button .confirm").click(function() {
    $(".dialogs_content")
      .removeClass("MoveShow")
      .addClass("MoveHide");
    setTimeout(function() {
      $(".dialogs").css("display", "none");
    }, 600);
  });

  /*调用省市插件*/
  function selectCity() {
    var area1 = new LArea();
    area1.init({
      trigger: "#city_model", //触发选择控件的文本框，同时选择完毕后name属性输出到该位置
      valueTo: "#city_val", //选择完毕后id属性输出到该位置
      nameTo: "#city_name", //选择完毕后id属性输出到该位置
      keys: {
        id: "id",
        name: "name"
      },
      type: 1, //数据源类型
      data: LAreaData //数据源
    });
  }
  /*发送验证码倒计时*/
  $(".countdown").click(function(event) {
    if (sendtype && $(".countdown").hasClass("active") && personInfo.mobile) setIntertime();
  });
  function setIntertime() {
    sendtype = false;
    var mines = 10,
      set,
      timeBox = $(".countdown");
    timeBox.html(mines + "s");
    timeBox.hasClass("active") && timeBox.removeClass("active");
    set = setInterval(function() {
      if (mines <= 1) {
        sendtype = true;
        timeBox.html("发送验证码");
        !timeBox.hasClass("active") && timeBox.addClass("active");
        clearInterval(set);
        return;
      }
      mines--;
      timeBox.html(mines + "s");
    }, 1000);
  }

  //缓存投保人信息
  function setStorage() {
    validate.setStorage.set("personInfo", JSON.stringify(personInfo));
  }

  /*勾选服务协议*/
  $("#clausetrue").click(function(event) {
    var _this = $(this);
    _this.toggleClass("active");
    personInfo.isChecked = personInfo.isChecked == true ? false : true;
    console.log(personInfo.isChecked);
  });
});
