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
  Select,
  TableContainer,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { socket } from "./socket";
import { msToTime } from "./helpers";
import { TOKENS } from "./constants";

function App() {
  const toast = useToast();
  const [userId, setUserId] = useState("64d9b68bf11bd7f93b8381de");
  const [product, setProduct] = useState("geeky");
  const [messages, setMessages] = useState();
  const [isConnected, setIsConnected] = useState(socket.connected);
  console.log({ messages })
  useEffect(() => {
    try {

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
      socket.on('connect_error', err => console.error(err))
      socket.on('connect_failed', err => console.error(err))
      // socket.on("foo", onFooEvent);
    } catch (error) {
      console.log(error)
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
      // socket.off("foo", onFooEvent);
    };
  }, []);

  const getFormattedMessages = (oldMessages, msg) => {
    const { type, data } = msg;

    if (type === "timeData") {
      const { _id, estimatedTime } = data;

      return {
        ...oldMessages,
        [_id]: {
          ...(oldMessages?.[_id] ? oldMessages[_id] : {}),
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
        [_id.$oid]: {
          ...(oldMessages?.[_id.$oid] ? oldMessages[_id.$oid] : {}),
          status: percentage === 100 ? "completed" : "in-progress",
          estimatedTime: 0,
          percentage,
        },
      };
    }

    return oldMessages;
  };
  console.log({ userId })
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
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/text-to-image`, {
        prompt: "cat",
        negativePrompt: " ",
        imgArtStyle: "fine arts",
        model: "stable_diffusion_xl",
        scheduler: "DDIMScheduler",
        width: 720,
        height: 720,
        numInferenceSteps: 50,
        guidanceScale: 10,
        manualSeed: 1,
        denoisingEnd: 0.7,
        strength: 0.3,
      }, {
        headers: {
          Authorization: `Bearer ${TOKENS[userId]}`
        }
      });

      setMessages(prevMessages => ({
        ...prevMessages,
        [data.data.referenceId]: {
          status: "pending",
          estimatedTime: 0,
          progress: 0,
          sourceId: data.data._id
        },
      }))

      toast({
        title: 'Request sent successfully',
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: error?.response?.data?.message || error?.message,
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

  const handleCancelRequest = async (id, sourceId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/text-to-image/cancel-request/${sourceId}`, {}, {
        headers: {
          Authorization: `Bearer ${TOKENS[userId]}`
        }
      });

      setMessages(prevMessages => {
        const newMessages = { ...prevMessages }
        delete newMessages[id]
        return newMessages
      })

      toast({
        title: 'Request cancelled successfully',
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
  }

  return (
    <Grid gap={3}>
      {/* <Input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      /> */}
      <Select placeholder='Select user' value={userId} onChange={e => setUserId(e.target.value)}>
        <option value='64d9b68bf11bd7f93b8381de'>64d9b68bf11bd7f93b8381de</option>
        <option value='64e59aed85dcc163735eaa77'>64e59aed85dcc163735eaa77</option>
        <option value='64e59b0485dcc163735eaa7b'>64e59b0485dcc163735eaa7b</option>
      </Select>
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
                <Th />
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
                    <Td>
                      <Button
                        disabled={messages[id].status !== "pending"}
                        size="xs"
                        variant='outline'
                        onClick={() => handleCancelRequest(id, messages[id].sourceId)}
                      >
                        Cancel
                      </Button>
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
