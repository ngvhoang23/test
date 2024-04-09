import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Button, Image, FlatList, SafeAreaView, Dimensions, ScrollView } from "react-native";
import axios from "axios";
import FlatButton from "../../shared/FlatButton";
import { useIsFocused } from "@react-navigation/native";
import SearchBar from "../../components/SearchBar";
import { SCREEN_HEIGHT, SCREEN_WIDTH, _retrieveData, normalize } from "../../defined_function";
import BorrowedBookItem from "../../components/BorrowedBookItem";
import { AntDesign } from "@expo/vector-icons";
import BorrowerItem from "../../components/BorrowerItem";

function BorrowersManDashboard({ navigation }) {
  const [borrowers, setBorrowers] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const isFocused = useIsFocused();

  useEffect(() => {
    setSearchValue("");

    if (isFocused) {
      _retrieveData("ACCESS_TOKEN")
        .then((access_token) => {
          const config = {
            headers: { Authorization: `Bearer ${access_token}` },
          };
          axios
            .get(`http://10.0.2.2:5000/borrowed-books/borrowing-readers`, config)
            .then((result) => {
              setBorrowers([...result.data]);
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

  const onSearch = () => {
    navigation.navigate("Borrowers Search Result", {
      search_value: searchValue,
      placeholder: "search borrowers...",
    });
  };

  return (
    <View style={styles.wrapper}>
      <SearchBar
        _styles={styles.searchBar}
        placeholder="search borrowers..."
        value={searchValue}
        onChange={(value) => setSearchValue(value)}
        onSearch={onSearch}
      />

      <ScrollView>
        <View style={styles.borrowerList}>
          {borrowers.map((borrower, index) => {
            return (
              <BorrowerItem
                key={borrower?.user_id}
                _style={[styles.borrowerItem]}
                data={borrower}
                borrowing_books={borrower.borrowed_books || 0}
                onPress={() =>
                  navigation.navigate("Borrowing Books", {
                    borrower_info: borrower,
                  })
                }
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  borrowerList: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(6),
    overflow: "scroll",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  borrowerItem: {
    width: "100%",
    padding: normalize(10),
    borderRadius: normalize(10),
    marginBottom: normalize(14),
  },
});

export default BorrowersManDashboard;