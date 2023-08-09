import "./App.css";
import {
  Button,
  Grid,
  Input,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { socket } from "./socket";
import { msToTime } from "./helpers";

function App() {
  const toast = useToast();
  const [userId, setUserId] = useState("user-1");
  const [product, setProduct] = useState("geeky");
  const [messages, setMessages] = useState();
  const [isConnected, setIsConnected] = useState(socket.connected);
  console.log({ messages });
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // function onFooEvent(value) {
    //   setFooEvents((previous) => [...previous, value]);
    // }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // socket.on("foo", onFooEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
      // socket.off("foo", onFooEvent);
    };
  }, []);

  const getFormattedMessages = (oldMessages, msg) => {
    console.log({ msg });
    const { type, data } = msg;

    if (type === "timeData") {
      const { _id, estimatedTime } = data;

      return {
        ...oldMessages,
        [_id]: {
          status: "pending",
          estimatedTime,
          progress: 0,
        },
      };
    } else if (type === "currentProgress") {
      const { percentage, result } = data;
      const { _id } = result;

      return {
        ...oldMessages,
        [_id]: {
          status: percentage === 100 ? "completed" : "in-progress",
          estimatedTime: 0,
          percentage,
        },
      };
    }

    return oldMessages;
  };

  useEffect(() => {
    if (isConnected) {
      socket.emit("join", {
        userId,
        product,
      });

      const handleNewMessage = (msg) => {
        setMessages((oldMessages) => {
          return getFormattedMessages(oldMessages, msg);
        });
      };

      socket.on("new_msg", handleNewMessage);
    }
  }, [isConnected, userId, product]);

  const handleSendRequestClick = async () => {
    try {
      const response = await axios.post("http://localhost:3050/send-request", {
        userId,
        product,
      });

      toast({
        title: response.data.message,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleConnectSocket = () => {
    if (!isConnected) {
      socket.connect();
    } else {
      socket.disconnect();
    }
  };

  return (
    <Grid gap={3}>
      <Input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <Input
        type="text"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
      />
      <Button colorScheme="teal" onClick={handleConnectSocket}>
        {isConnected ? "Disconnect socket" : "Connect socket"}
      </Button>
      <Button
        colorScheme="teal"
        isDisabled={!isConnected}
        onClick={handleSendRequestClick}
      >
        Send request
      </Button>
      {messages ? (
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Status</Th>
                <Th isNumeric>Estimated time</Th>
                <Th isNumeric>Percentage</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.keys(messages).map((id) => {
                return (
                  <Tr key={id}>
                    <Td>{id}</Td>
                    <Td>{messages[id].status}</Td>
                    <Td isNumeric>
                      {messages[id].status === "pending"
                        ? msToTime(messages[id].estimatedTime)
                        : "-"}
                    </Td>
                    <Td isNumeric>
                      {messages[id].status === "pending"
                        ? "-"
                        : `${messages[id].percentage}%`}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      ) : null}
    </Grid>
  );
}

export default App;
