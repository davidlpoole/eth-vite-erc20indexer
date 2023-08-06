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
    Spinner, Card, CardBody, Divider, Stack, CircularProgress,
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
        } else if (!ethers.utils.isAddress(userAddress)) {
            setStatus('invalid')
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

        if (filtered.length > 0) {
            for (let i = 0; i < filtered.length; i++) {
                const tokenData = alchemy.core.getTokenMetadata(
                    filtered[i].contractAddress
                );
                tokenDataPromises.push(tokenData);
            }

            setTokenDataObjects(await Promise.all(tokenDataPromises));
            setStatus('loaded');
            return;
        }

        setStatus('notfound')

    }

    return (
        <Box w="100vw" h="100vh">
            <Center className="head">ERC-20 Token Balance Checker</Center>
            <Box pt={36}>
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
                    placeholder="Enter an address or get address from browser wallet"
                />

                {(userAddress !== '') ? (
                    <Button fontSize={20} onClick={getTokenBalance} mt={36}>
                        Check ERC-20 Token Balances
                    </Button>
                ) : (
                    <Button fontSize={20} onClick={getWalletAddress} mt={36}>
                        Get browser wallet address
                    </Button>
                )
                }

                {(status === 'loaded') ? (
                    <div>
                        <SimpleGrid w={'90vw'} mt={36} columns={4} spacing={30}>
                            {results.map((e, i) => {
                                return (
                                    <Card key={i} className='test'>
                                        <Stack>
                                            <Image src={tokenDataObjects[i].logo} maxH={64}
                                                   maxW={64} boxSize={64}/>
                                            <div>{Utils.formatUnits(
                                                e.tokenBalance,
                                                tokenDataObjects[i].decimals
                                            )}</div><div>{tokenDataObjects[i].symbol}</div>

                                        </Stack>
                                    </Card>


                                );
                            })}
                        </SimpleGrid>
                    </div>

                ) : null }
                {(status === 'fetching') ? <CircularProgress isIndeterminate mt={36}/> : null}
                {(status === 'invalid') ? <Box color="red" mt={36}>Invalid address</Box> : null }
                {(status === 'notfound') ? <Box color="red" mt={36}>No ERC-20 tokens found</Box> : null }
            </Flex>
            </Box>
        </Box>
    );
}

export default App;
