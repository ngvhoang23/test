import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Button,
  TextInput,
  View,
  Text,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Image,
  Pressable,
  ImageBackground,
} from "react-native";
import { globalStyles } from "../../styles/global.js";
import { Formik } from "formik";
import FlatButton from "../../shared/FlatButton.js";
import * as yup from "yup";
import InputItem from "../../components/InputItem.js";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AvatarPicker from "../../components/AvatarPicker.js";
import DateTimePicker from "@react-native-community/datetimepicker";
import MyDateTimePicker from "../../components/MyDateTimePicker.js";
import { Picker } from "@react-native-picker/picker";
import MenuPickers from "../../components/MenuPicker.js";
import LoadingModal from "../../components/LoadingModal.js";
import AlertModal from "../../components/AlertModal.js";
import { _retrieveData, normalize, validateEmail } from "../../defined_function/index.js";

const formSchema = yup.object({
  user_name: yup.string().trim().required(),
  password: yup
    .string()
    .trim()
    .required()
    .test("", "Password should contains atleast 8 charaters and containing uppercase,lowercase and numbers", (val) => {
      return new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/).test(val);
    }),
  birth_date: yup
    .string()
    .required()
    .test("older than 17", "Age must be equal or greater than 18", (val) => {
      const year = val.split("-")[0];
      const currentYear = new Date().getFullYear();
      age = currentYear - year;
      return age >= 18;
    }),
  first_name: yup.string().trim().required(),
  last_name: yup.string().trim().required(),
  email_address: yup.string().test("email pattern", "Enter a valid email address", (val) => {
    if (!val) {
      return true;
    } else {
      return validateEmail(val.trim());
    }
  }),
  phone_num: yup.string().test("phone number pattern", "Invalid phone number", (val) => {
    if (!val) {
      return true;
    }
    return new RegExp(/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/).test(val.trim());
  }),
});

function AddEmployeScreen({ navigation }) {
  const [avatar, setAvatar] = useState();
  const [isShowDatePicker, setIsShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState({ isSuccess: false, visible: false });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const trySubmit = (empInfo) => {
    const { user_name, password, phone_num, birth_date, gender, first_name, last_name, address } = empInfo;
    setIsLoading(true);
    const formData = new FormData();

    avatar &&
      formData.append("avatar", {
        uri: avatar.uri,
        name: "emp-avatar",
        type: avatar.mimeType,
      });

    formData.append("user_name", user_name.trim());
    formData.append("password", password.trim());
    phone_num && formData.append("phone_num", phone_num.trim());
    birth_date && formData.append("birth_date", birth_date);
    address && formData.append("address", address.trim());
    formData.append("gender", gender.value);
    first_name && formData.append("first_name", first_name.trim());
    last_name && formData.append("last_name", last_name.trim());

    return new Promise((resolve, reject) => {
      _retrieveData("ACCESS_TOKEN")
        .then((access_token) => {
          const configurations = {
            method: "POST",
            url: `http://10.0.2.2:5000/users/employee`,
            data: formData,
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${access_token}`,
            },
          };

          axios(configurations)
            .then((result) => {
              resolve(result);
            })
            .catch((err) => {
              if (err?.response?.data?.code === "ER_DUP_ENTRY") {
                setResultStatus({ isSuccess: 0, visible: true, message: "Duplicate user name" });
                setIsLoading(false);
              } else {
                reject(err);
              }
              console.log("err", err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  const handleSubmit = (readerInfo) => {
    trySubmit(readerInfo)
      .then((result) => {
        navigation.navigate("Dashboard", { screen: "Employees" });
        setResultStatus({ isSuccess: 1, visible: true });
      })
      .catch((err) => {
        console.log(err);
        if (err?.message === "Network Error") {
          trySubmit(readerInfo)
            .then((result) => {
              setResultStatus({ isSuccess: 1, visible: true });
              navigation.navigate("Dashboard", {
                screen: "Employees",
              });
            })
            .catch((err) => {
              setResultStatus({ isSuccess: 0, visible: true });
            })
            .finally((result) => {
              setIsLoading(false);
            });
        }
      })
      .finally((result) => {
        setIsLoading(false);
      });
  };

  return (
    <ImageBackground source={require("../../assets/images/page_bg1.jpg")} style={styles.wrapper}>
      <Formik
        initialValues={{
          user_name: "",
          password: "",
          phone_num: "",
          birth_date: new Date().toISOString().split("T")[0],
          gender: { value: 1, index: 0 },
          first_name: "",
          last_name: "",
          address: "",
        }}
        validationSchema={formSchema}
        onSubmit={(values, actions) => {
          handleSubmit(values);
        }}
      >
        {(props) => (
          <TouchableOpacity style={styles.formWrapper} activeOpacity={1.0} onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AvatarPicker
                _styles={styles.avatarPicker}
                avatar={avatar}
                setAvatar={setAvatar}
                onPickImage={pickImage}
                title={"Chọn ảnh đại diện"}
              />
              <InputItem
                _styles={[styles.input]}
                placeholder="Tên đăng nhập"
                lableTitle="Tên đăng nhập"
                onChange={props.handleChange("user_name")}
                value={props.values.user_name}
                errorText={props.touched.user_name ? props.errors.user_name : undefined}
                border
              />
              <InputItem
                _styles={[styles.input]}
                placeholder="Mật khẩu"
                lableTitle="Mật khẩu"
                onChange={props.handleChange("password")}
                value={props.values.password}
                errorText={props.touched.password ? props.errors.password : undefined}
                border
                secureTextEntry={true}
              />
              <InputItem
                _styles={[styles.input]}
                placeholder="Số điện thoại"
                lableTitle="Số điện thoại"
                onChange={props.handleChange("phone_num")}
                value={props.values.phone_num}
                errorText={props.touched.phone_num ? props.errors.phone_num : undefined}
                border
              />
              <MyDateTimePicker
                _styles={[styles.input]}
                lableTitle="Ngày sinh"
                value={props.values.birth_date}
                errorText={props.touched.birth_date ? props.errors.birth_date : undefined}
                border
                onPress={() => setIsShowDatePicker(true)}
              />
              {isShowDatePicker && (
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={new Date()}
                  onChange={(event, selectedDate) => {
                    setIsShowDatePicker(false);
                    props.setFieldValue("birth_date", selectedDate.toISOString().split("T")[0]);
                  }}
                />
              )}

              <InputItem
                _styles={[styles.input]}
                placeholder="Địa chỉ"
                lableTitle="Địa chỉ"
                onChange={props.handleChange("address")}
                value={props.values.address}
                errorText={props.touched.address ? props.errors.address : undefined}
                border
                numberOfLines={4}
                multiline
              />

              <MenuPickers
                _styles={[styles.input]}
                lableTitle="Giới tính"
                initIndex={0}
                value={props.values.gender}
                errorText={props.touched.gender ? props.errors.gender : undefined}
                options={[
                  { title: "Nam", value: 1 },
                  { title: "Nữ", value: 0 },
                ]}
                border
                onChange={(selectedValue, selectedIndex) =>
                  props.setFieldValue("gender", { value: selectedValue, index: selectedIndex })
                }
              />

              <InputItem
                _styles={[styles.input]}
                placeholder="Họ"
                lableTitle="Họ"
                onChange={props.handleChange("first_name")}
                value={props.values.first_name}
                errorText={props.touched.first_name ? props.errors.first_name : undefined}
                border
              />
              <InputItem
                _styles={[styles.input]}
                placeholder="Tên và tên đệm"
                lableTitle="Tên và tên đệm"
                onChange={props.handleChange("last_name")}
                value={props.values.last_name}
                errorText={props.touched.last_name ? props.errors.last_name : undefined}
                border
              />
              <FlatButton
                _styles={styles.submitBtn}
                onPress={props.handleSubmit}
                text="Tạo nhân viên"
                fontSize={normalize(10)}
              />
            </ScrollView>
          </TouchableOpacity>
        )}
      </Formik>
      <LoadingModal visible={isLoading} />
      <AlertModal
        onClose={() => setResultStatus({ isSuccess: 0, visible: false })}
        isSuccess={resultStatus?.isSuccess}
        visible={resultStatus?.visible ? true : false}
        text={resultStatus?.message}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontFamily: "nunito-medium",
    fontSize: normalize(18),
    width: "100%",
    marginLeft: normalize(40),
  },

  avatarPicker: {
    width: "100%",
    marginBottom: normalize(20),
  },

  formWrapper: {
    width: "100%",
    marginTop: normalize(20),
    marginBottom: 0,
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "scroll",
  },

  formContainer: {
    width: "90%",
  },

  input: {
    marginBottom: normalize(20),
    width: "100%",
  },

  submitBtn: {
    width: "90%",
    height: normalize(32),
    marginTop: normalize(6),
    marginBottom: normalize(16),
    paddingVertical: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6c60ff",
    borderRadius: normalize(1000),
  },
});

export default AddEmployeScreen;
