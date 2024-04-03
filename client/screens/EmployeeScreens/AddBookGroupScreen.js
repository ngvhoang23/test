import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ScrollView, Keyboard, TouchableOpacity, Text } from "react-native";
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
import { _retrieveData, validateEmail } from "../../defined_function/index.js";
import { useIsFocused } from "@react-navigation/native";

const formSchema = yup.object({
  book_name: yup.string().trim().required(),
  price: yup.string().trim().required(),
  published_date: yup
    .string()
    .required()
    .test("", "Only accept books published within 8 years", (val) => {
      const year = val.split("-")[0];
      const currentYear = new Date().getFullYear();
      return currentYear - year <= 8;
    }),
});

function AddBookGroupScreen({ navigation }) {
  const [coverPhoto, setCoverPhoto] = useState();
  const [isShowDatePicker, setIsShowDatePicker] = useState(false);
  const [isShowStartDatePicker, setIsShowStartDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState({ isSuccess: false, visible: false });
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      _retrieveData("ACCESS_TOKEN")
        .then((access_token) => {
          const category_config = {
            headers: { Authorization: `Bearer ${access_token}` },
          };
          axios
            .get(`http://10.0.2.2:5000/books/categories`, category_config)
            .then((result) => {
              setCategories([...result.data]);
            })
            .catch((error) => {
              console.log(error);
            });
          const author_config = {
            headers: { Authorization: `Bearer ${access_token}` },
          };
          axios
            .get(`http://10.0.2.2:5000/books/authors`, author_config)
            .then((result) => {
              setAuthors([...result.data]);
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [isFocused]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverPhoto(result.assets[0]);
    }
  };

  const handleSubmit = (bookInfo) => {
    const { book_name, price, published_date, description, publish_com, author, category } = bookInfo;

    setIsLoading(true);
    const formData = new FormData();

    coverPhoto &&
      formData.append("cover-photo", {
        uri: coverPhoto.uri,
        name: "cover-photo",
        type: coverPhoto.mimeType,
      });

    formData.append("book_name", book_name.trim());
    formData.append("price", price.trim());
    formData.append("published_date", published_date);
    description && formData.append("description", description);
    publish_com && formData.append("publish_com", publish_com.trim());
    formData.append("author_id", author?.author_id);
    formData.append("category_id", category?.category_id);

    _retrieveData("ACCESS_TOKEN")
      .then((access_token) => {
        const configurations = {
          method: "POST",
          url: `http://10.0.2.2:5000/books/book-groups`,
          data: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${access_token}`,
          },
        };

        axios(configurations)
          .then((result) => {
            setResultStatus({ isSuccess: 1, visible: true });
            // navigation.navigate("Book Groups");
          })
          .catch((err) => {
            setResultStatus({ isSuccess: 0, visible: true });
            console.log("err", err);
          })
          .finally((result) => {
            setIsLoading(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <View style={styles.wrapper}>
      <Formik
        initialValues={{
          book_name: "",
          price: "",
          published_date: new Date().toISOString().split("T")[0],
          description: "",
          publish_com: "",
          author: authors[0],
          category: categories[0],
        }}
        validationSchema={formSchema}
        onSubmit={(values, actions) => {
          actions.resetForm();
          handleSubmit(values);
        }}
      >
        {(props) => (
          <TouchableOpacity style={styles.formWrapper} activeOpacity={1.0} onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <AvatarPicker
                _styles={styles.avatarPicker}
                avatar={coverPhoto}
                setAvatar={setCoverPhoto}
                onPickImage={pickImage}
                title={"Choose cover photo"}
              />

              <InputItem
                _styles={[styles.input]}
                placeholder="Book name"
                lableTitle="Book name"
                onChange={props.handleChange("book_name")}
                value={props.values.book_name}
                errorText={props.errors.book_name}
              />

              <InputItem
                _styles={[styles.input]}
                placeholder="Price"
                lableTitle="Price"
                onChange={props.handleChange("price")}
                value={props.values.price}
                errorText={props.errors.price}
                numberOnly
              />

              <MyDateTimePicker
                _styles={[styles.input]}
                lableTitle="Published date"
                value={props.values.published_date}
                errorText={props.errors.published_date}
                onPress={() => setIsShowDatePicker(true)}
              />
              {isShowDatePicker && (
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={new Date(props.values.published_date)}
                  onChange={(event, selectedDate) => {
                    setIsShowDatePicker(false);
                    props.setFieldValue("published_date", selectedDate.toISOString().split("T")[0]);
                  }}
                />
              )}

              <InputItem
                _styles={[styles.input]}
                placeholder="Description"
                lableTitle="Description"
                multiline
                onChange={props.handleChange("description")}
                value={props.values.description}
                errorText={props.errors.description}
                numberOfLines={4}
              />

              <InputItem
                _styles={[styles.input]}
                placeholder="Publish Comany"
                lableTitle="Publish Comany"
                onChange={props.handleChange("publish_com")}
                value={props.values.publish_com}
                errorText={props.errors.publish_com}
              />

              <MenuPickers
                _styles={[styles.input]}
                lableTitle="Author"
                errorText={props.errors.author}
                options={authors?.map((author) => {
                  return { title: author.author_name, value: author.author_id };
                })}
                onChange={(selectedValue, selectedIndex) => props.setFieldValue("author", authors[selectedIndex])}
              />

              <MenuPickers
                _styles={[styles.input]}
                lableTitle="Category"
                errorText={props.errors.category}
                options={categories?.map((category) => {
                  return { title: category.category_name, value: category.category_id };
                })}
                onChange={(selectedValue, selectedIndex) => props.setFieldValue("category", categories[selectedIndex])}
              />
            </ScrollView>
            <FlatButton _styles={styles.submitBtn} onPress={props.handleSubmit} text="submit" fontSize={15} />
          </TouchableOpacity>
        )}
      </Formik>
      <LoadingModal visible={isLoading} />
      <AlertModal
        onClose={() => setResultStatus({ isSuccess: 0, visible: false })}
        isSuccess={resultStatus?.isSuccess}
        visible={resultStatus?.visible ? true : false}
      />
    </View>
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
    fontSize: 18,
    width: "100%",
    marginLeft: 40,
  },

  avatarPicker: {
    width: "100%",
    marginBottom: 20,
  },

  formWrapper: {
    width: "100%",
    height: "96%",
    margin: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },

  formContainer: {
    width: "90%",
    height: "100%",
  },

  input: {
    marginBottom: 20,
    width: "100%",
  },

  position: {
    marginRight: 20,
    width: "20%",
  },

  submitBtn: {
    width: "80%",
    marginTop: 14,
    marginBottom: "20px",
    paddingVertical: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e74fd",
  },
});

export default AddBookGroupScreen;
