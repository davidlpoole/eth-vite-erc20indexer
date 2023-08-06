import {
    Box,
    Button,
    Center,
    Flex,
    Heading,
    Image,
    Input,
    SimpleGrid,
    Text,
    Spinner,
} from '@chakra-ui/react';
import {Alchemy, Network, Utils} from 'alchemy-sdk';
import {useState} from 'react';
import {ethers} from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
    const [userAddress, setUserAddress] = useState('');
    const [results, setResults] = useState([]);
    const [tokenDataObjects, setTokenDataObjects] = useState([]);
    const [status, setStatus] = useState('');

    async function getWalletAddress() {
        const accounts = await provider.send('eth_requestAccounts', []);
        setUserAddress(accounts[0]);
    }

    async function getTokenBalance() {
        if (userAddress === '') {
            setStatus('');
            return
        }

        setStatus('fetching');

        const config = {
            apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
            network: Network.ETH_MAINNET,
        };

        const alchemy = new Alchemy(config);
        const data = await alchemy.core.getTokenBalances(userAddress);
        const filtered = data.tokenBalances.filter((item) => {
            return item.tokenBalance > 0
        })
        // const sorted = filtered.sort((a,b)=> a.tokenBalance-b.tokenBalance);
        // console.log(sorted);
        setResults(filtered);

        const tokenDataPromises = [];

        for (let i = 0; i < filtered.length; i++) {
            const tokenData = alchemy.core.getTokenMetadata(
                filtered[i].contractAddress
            );
            tokenDataPromises.push(tokenData);
        }

        setTokenDataObjects(await Promise.all(tokenDataPromises));
        setStatus('loaded');
    }

    return (
        <Box w="100vw">

            <Flex
                w="100%"
                flexDirection="column"
                alignItems="center"
                justifyContent={'center'}
            >

                <Input
                    onChange={(e) => {
                        setStatus('');
                        setUserAddress(e.target.value);
                    }}
                    color="black"
                    w="600px"
                    textAlign="center"
                    p={4}
                    bgColor="white"
                    fontSize={24}
                    value={userAddress}
                />

                {(userAddress !== '') ? (
                    <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
                        Check ERC-20 Token Balances
                    </Button>
                ) : (
                    <Button fontSize={20} onClick={getWalletAddress} mt={36} bgColor="blue">
                        Get browser wallet address
                    </Button>
                )
                }

                {(status === 'loaded') ? (
                    <div>
                        <Button fontSize={20} onClick={() => {
                            setStatus('')
                        }} mt={36} bgColor="blue">
                            Hide
                        </Button>
                        <SimpleGrid w={'90vw'} mt={36} columns={4} spacing={24}>
                            {results.tokenBalances.map((e, i) => {
                            {results.map((e, i) => {
                                return (
                                    <Flex
                                        flexDir={'column'}
                                        color="white"
                                        bg="blue"
                                        w={'20vw'}
                                        key={e.id}
                                    >
                                        <Box>
                                            <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                                        </Box>
                                        <Box>
                                            <b>Balance:</b>&nbsp;
                                            {Utils.formatUnits(
                                                e.tokenBalance,
                                                tokenDataObjects[i].decimals
                                            )}
                                        </Box>
                                        <Image src={tokenDataObjects[i].logo}/>
                                    </Flex>
                                );
                            })}
                        </SimpleGrid>
                    </div>
                ) : (status)
                }
            </Flex>
        </Box>
    );
}

export default App;
