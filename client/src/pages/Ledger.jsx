import { useEffect, useMemo, useState } from "react";
import { Container, Box, Grid, Card, Flex, Text, Paper, Center, Loader } from "@mantine/core";
import { useTranslation } from 'react-i18next';
import { IconMoneybag } from "@tabler/icons-react";
import axios from "axios";

const Ledger = () => {
    const [salesData, setSalesData] = useState([])
    const [expensesData, setExpensesData] = useState([])
    const [transfersData, setTransfersData] = useState([])
    const [loading, setLoading] = useState(false)

    const BASE_URL = import.meta.env.VITE_URL;
    const { t } = useTranslation();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ salesRes, expensesRes, transfersRes ] = await Promise.all([
                axios.get(`${BASE_URL}/sale-invoices/list`),
                axios.get(`${BASE_URL}/expenses/list`),
                axios.get(`${BASE_URL}/transfers/list-today`)
            ])
            console.log(expensesRes.data)
            console.log(salesRes.data.sales)
            console.log(transfersRes.data.data)
            setSalesData(salesRes.data.sales || [])
            setExpensesData(expensesRes.data || [] )
            setTransfersData(transfersRes.data.data || [])
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // helper function
    const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();

    // filter data to match only today's record
    const todaySales = useMemo(() => salesData.filter(s => isToday(s.createdAt)), [salesData])
    const todayExpenses = useMemo(() => expensesData.filter(s => isToday(s.createdAt)), [expensesData])
    const todayTransfers = useMemo(() => transfersData.filter(s => isToday(s.createdAt)), [transfersData])

    console.log("Todays's Expenses data: ", expensesData)
    // compute sales, expenses, and cashout within the day
    // const totalAmountFromTodaySales = todaySales.reduce((acc, sale) => acc + sale.totalCartAmount, 0);
    const totalAmountFromTodaySales = todaySales.reduce(
        (acc, sale) => acc + (sale.totalPaidAmount || sale.totalCartAmount),
        0
    );
    console.log("Today Sales: ", todaySales)
    console.log("Total today's sales volume: ", totalAmountFromTodaySales)

    const totalExpensesToday = todayExpenses.reduce((acc, exp) => {
        if(exp.paymentMethod === "Cash") {
            acc.cash += exp.amount || 0;
        } else if(exp.paymentMethod === "Bankak") {
            acc.bankak += exp.amount || 0;
        }
        acc.total += exp.amount || 0;
        return acc;
    }, { cash: 0, bankak: 0, total: 0 });

//     const totalExpenses = todayExpenses.reduce(
//     (acc, exp) => {
//       if (exp.paymentMethod === "Cash") acc.cash += exp.amount || 0;
//       else if (exp.paymentMethod === "Bankak") acc.bankak += exp.amount || 0;
//       acc.total += exp.amount || 0;
//       return acc;
//     },
//     { cash: 0, bankak: 0, total: 0 }
//   );

    // const totalTransfersToday = todayTransfers.reduce((acc, transfer) => acc + transfer.amount, 0);
    const totalTransfersToday = todayTransfers.reduce(
    (acc, transfer) => acc + (transfer.amount || 0),
    0
  );

    // const salesAmountBreakdown = todaySales.reduce((acc, sale) => {
    //     if(sale.paymentMethod === "Cash") {
    //         acc.cash += sale.cashAmount || 0;
    //     } else if(sale.paymentMethod === "Bankak") {
    //         acc.bankak += sale.bankakAmount || 0;
    //     } else if(sale.paymentMethod === "Cash + Bankak") {
    //         acc.cash += sale.cashAmount || 0;
    //         acc.bankak+= sale.bankakAmount || 0;
    //     } else if(sale.paymentMethod === "Cashout") {
    //         acc.cash -= sale.cashAmount || 0;
    //         acc.bankak += sale.bankakAmount || 0;
    //     }
    // }, { cash: 0, bankak: 0, total: 0 });

    const salesAmountBreakdown = todaySales.reduce(
        (acc, sale) => {
        const mode = sale.modeOfPayment || sale.paymentMethod;

        if (mode === "Cash") {
            acc.cash += sale.cashAmount || sale.totalCartAmount || 0;
        } else if (mode === "Bankak") {
            acc.bankak += sale.bankakAmount || sale.totalCartAmount || 0;
        } else if (mode === "Cash + Bankak") {
            acc.cash += sale.cashAmount || 0;
            acc.bankak += sale.bankakAmount || 0;
        } else if (mode === "Fawry") {
            acc.fawry += sale.bankakAmount || sale.totalCartAmount || 0;
        } else if (mode === "Ocash") {
            acc.ocash += sale.bankakAmount || sale.totalCartAmount || 0;
        } else if (mode === "Cashout") {
            acc.cash -= sale.cashAmount || 0;
            acc.bankak += sale.bankakAmount || 0;
        }
        acc.total += sale.totalCartAmount || 0;
        return acc;
        },
        { cash: 0, bankak: 0, fawry: 0, ocash: 0, total: 0 }
    );
    console.log("salesAmountBreakdown: ", salesAmountBreakdown);

    const totalCashBalance = (salesAmountBreakdown.cash || 0) - (totalExpensesToday.cash || 0) - totalTransfersToday;
    const totalBankakBalance = (salesAmountBreakdown.bankak || 0) - (totalExpensesToday.bankak || 0) + totalTransfersToday;
    const totalFawryBalance = salesAmountBreakdown.fawry || 0;
    const totalOcashBalance = salesAmountBreakdown.ocash || 0;

    const grandTotal = totalCashBalance + totalBankakBalance + totalFawryBalance + totalOcashBalance;

    // const currentBalance = (salesAmountBreakdown, totalExpensesToday, totalTransfersToday) => {
    // }
    // let totalCashBalance;
    // let totalBankakBalance;

    // totalCashBalance = salesAmountBreakdown?.cash - totalExpensesToday?.cash || 0;
    // totalBankakBalance = salesAmountBreakdown?.bankak  - totalExpensesToday || 0;
    // totalCashBalance -= totalTransfersToday || 0; // current cash balance (after cashout)
    // totalBankakBalance += totalTransfersToday || 0; // current bankak balance (after cashout)
    // const grandTotal = totalCashBalance + totalBankakBalance || 0;
    console.log(totalExpensesToday)

    return (
       <Container size="90%">
        <Paper shadow="md" p="sm">
            {loading &&
                <Center>
                    <Loader size={32} color="green" variant="dots" />
                </Center>
            }
            <Grid>
                <Grid.Col span={3}><FinanceCard title={t("Cash-Balance")} value={totalCashBalance?.toLocaleString()} color="green" Icon={<IconMoneybag size={32} color="yellow" />} /></Grid.Col>
                <Grid.Col span={3}><FinanceCard title={t("Bankak-Balance")} value={totalBankakBalance?.toLocaleString()} color="green" /></Grid.Col>
                <Grid.Col span={3}><FinanceCard title={t("Fawry-Balance")} value={salesAmountBreakdown.fawry || 0?.toLocaleString()} color="green" /></Grid.Col>
                <Grid.Col span={3}><FinanceCard title={t("OCash-Balance")} value={salesAmountBreakdown.ocash || 0?.toLocaleString()} color="green" /></Grid.Col>
            </Grid>
            <Grid mt="lg">
                <Grid.Col span={6}><FinanceCard title={t("Total-Income-Today")} value={totalAmountFromTodaySales?.toLocaleString()} color="green" /></Grid.Col>
                <Grid.Col span={6}><FinanceCard title={t("Total-Current-Balance")} value={grandTotal?.toLocaleString()} color="green" /></Grid.Col>
            </Grid>
            <Grid mt="lg">
                <Grid.Col span={3}><FinanceCard title={t("Cash-Expenses-Today")} value={totalExpensesToday?.cash} color="red" /></Grid.Col>
                <Grid.Col span={3}><FinanceCard title={t("Bankak-Expenses-Today")} value={totalExpensesToday?.bankak} color="red" /></Grid.Col>
                <Grid.Col span={3}><FinanceCard title={t("Total-Expenses-Today")} value={totalExpensesToday?.total} color="red" /></Grid.Col>
                <Grid.Col span={3}><FinanceCard title={t("Cashout-Today")} value={totalTransfersToday} color="orange" /></Grid.Col>
            </Grid>
        </Paper>
       </Container>
    )
}

const FinanceCard = ({title, value, color}) => {
    return (
        <Card shadow="sm" padding="md" radius="md" withBorder>
            <Flex justify="space-between">
                {/* <Box>
                    <Icon />
                </Box> */}
                <Box>
                    <Text fw={600}>{title}</Text>
                    <Text fw={700} fz="xl" color={color}>{value} SDG</Text>
                </Box>
            </Flex>
        </Card>
    )
}

export default Ledger;