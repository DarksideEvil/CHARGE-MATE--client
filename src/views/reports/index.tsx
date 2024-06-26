import './reports.css'
import { useState, useEffect } from 'react'
import CountUp from 'react-countup';
import { CiCalendarDate } from "react-icons/ci";
import { MdOutlineCurrencyExchange } from "react-icons/md";
import { LogError, Notify } from '../../errorHandler/debug';
import axios, { AxiosError } from 'axios';
import { URL } from '../../config';
import { jwtDecode } from 'jwt-decode';
import {
    fetchedReportsProps,
    reportProps,
    totalProps,
    decodedUserProps,
    fetchedUserProps
} from '../../aliases/alias';

export const Reports = () => {

    const [isFamilyMode, setIsFamilyMode] = useState<boolean>(true);
    const [isByDate, setIsByDate] = useState<boolean>(true);
    const [isAdvancedDate, setIsAdvancedDate] = useState<boolean>(false);
    const [isCurrency, setIsCurrency] = useState<boolean>(false);
    const [fetchedReports, setFetchedReports] = useState<fetchedReportsProps>();
    const [fetchedUser, setFetchedUser] = useState<fetchedUserProps | null>(null);
    const [isToday, setIsToday] = useState<boolean>(false);
    const [isYesterday, setIsYesterday] = useState<boolean>(false);
    const [visibleReports, setVisibleReports] = useState(5); // Initial number of reports to display
    const [loading, setLoading] = useState(false);
    // const [refreshKey, setRefreshKey] = useState<number>(0);
    const [dateState, setDateState] = useState<{
        day: number | string;
        month: number | string;
        year: number | string;
        today: boolean;
        yesterday: boolean;
        advancedDate: boolean;
        currency: string;
    }>({
        day: 0,
        month: 0,
        year: 0,
        today: false,
        yesterday: false,
        advancedDate: false,
        currency: ''
    });
    const jwt: string | null = localStorage?.getItem('jwt');

    const decodedUser: decodedUserProps = jwt ? jwtDecode(jwt) :
        { exp: 0, iat: 0, nickname: '', password: '', role: '', _id: '' };

    const handleLoadMore = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading time
        setVisibleReports(prevVisibleReports => prevVisibleReports + 5);
        setLoading(false);
    };

    const changeHandlerBasicSake = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'selectedDate') {
            const [year, month, day] = value.split('-').map(Number);
            setDateState(prevState => ({
                ...prevState,
                year: year || prevState.year,
                month: month || prevState.month,
                day: day || prevState.day
            }));
        } else {
            const numericValue = value ? Number(value) : '';
            setDateState(prevState => ({
                ...prevState,
                [name]: numericValue
            }));
        }
    };


    const changeHandler = (e: any) => {
        const { name, value } = e.target;
        // Convert currency to uppercase if it exists
        const updatedValue = name === 'currency' && value ? value.toUpperCase() : value;

        setDateState(prevState => ({
            ...prevState,
            [name]: updatedValue
        }));
    };

    const referToCalendar = () => {
        setIsByDate(false)
        setIsAdvancedDate(false)
    }

    const referToAdvancedMode = () => {
        setIsAdvancedDate(true)
        dateState.day = ''
        dateState.month = ''
        dateState.year = ''
        setIsAdvancedDate(true)
        setIsByDate(false)
    }

    const setCurrency = (struct: boolean) => {
        if (struct) {
            referToCalendar()
            setIsCurrency(!isCurrency)
        } else {
            setIsCurrency(!isCurrency)
        }
    }

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${URL}/users/${decodedUser?._id}`)
            setFetchedUser(res?.data[0])
        } catch (err) {
            Notify(LogError(err as AxiosError), 'err')
        }
    }

    const fetchReports = async () => {
        setLoading(true)
        // let endpoint: string;
        // if (!isFamilyMode || fetchedUser?.individual) {
        //     endpoint = 'reports/users/individualcharges';
        // } else {
        //     endpoint = 'reports/users/familycharges';
        // }
        let endpoint = isFamilyMode ? 'reports/users/familycharges' : 'reports/users/individualcharges';
        try {
            const res = await axios.get(`${URL}/${endpoint}`, {
                params: {
                    day: dateState.day ? dateState.day : undefined,
                    month: dateState.month ? dateState.month : undefined,
                    year: dateState.year ? dateState.year : undefined,
                    today: dateState.today ? dateState.today : undefined,
                    yesterday: dateState.yesterday ? dateState.yesterday : undefined,
                    advancedDate: isAdvancedDate ? isAdvancedDate : undefined,
                    currency: dateState.currency !== '' ? dateState.currency : undefined,
                },
                headers: { Authorization: jwt && JSON?.parse(jwt) }
            });

            res?.status === 200 && setFetchedReports(res?.data);
        } catch (err) {
            Notify(LogError(err as AxiosError), 'err')
        } finally {
            setLoading(false); // Clear loading state regardless of success or failure
        }
    }

    const formatDateValue = (year: number | string, month: number | string, day: number | string) => {
        if (year && month && day) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return '';
    };

    const handleToday = () => {
        const newToday = !isToday;
        setIsAdvancedDate(false);
        setIsToday(newToday);
        setIsYesterday(false);
        setDateState((prevState) => ({
            ...prevState,
            today: newToday,
            yesterday: false,
        }));
    };

    const handleYesterday = () => {
        const newYesterday = !isYesterday;
        setIsAdvancedDate(false);
        setIsYesterday(newYesterday);
        setIsToday(false);
        setDateState((prevState) => ({
            ...prevState,
            yesterday: newYesterday,
            today: false,
        }));
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (fetchedUser && fetchedUser.individual !== undefined) {
            setIsFamilyMode(!fetchedUser.individual);
        }
    }, [fetchedUser]);

    useEffect(() => {
        fetchReports();
    }, [dateState, isFamilyMode, fetchedUser]);

    const reports = fetchedReports?.reports ?? []; // Use optional chaining and fallback

    return (
        <>
            <div className="rep_wrapper mb-30 md:mb-10 lg:mb-0 bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad">
                <div className="rep_header text-center text-3xl mb-1">
                    <h1 className='capitalize'>reports overview</h1>
                </div>
                <div className="container mx-auto p-4 bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad max-sm:mb-12">
                    <div className="section-header capitalize flex md:mb-5">
                        {
                            isByDate && !isAdvancedDate &&
                            <div className="section-date flex items-center text-xl mr-3">
                                <CiCalendarDate onClick={referToCalendar} className='cursor-pointer' size={35} />
                            </div>
                        }
                        <div className={`section-date flex items-center text-xl mr-3`}>
                            <MdOutlineCurrencyExchange onClick={() => setCurrency(false)} className='cursor-pointer' size={25} />
                        </div>

                        <div className={`section-date flex items-center text-xl mr-3`}>
                            {/* Make the h1 focusable */}
                            {/* tabIndex={0} */}
                            <h1 onClick={() => handleToday()} className={`capitalize hover:underline cursor-pointer ${isToday && 'underline text-red-500'}`}>today</h1>
                        </div>
                        <div className={`section-date flex items-center text-xl mr-3`}>
                            <h1 onClick={() => handleYesterday()} className={`capitalize hover:underline cursor-pointer ${isYesterday && 'underline text-red-500'}`}>yesterday</h1>
                        </div>

                        {/* for larger screens */}
                        {
                            !fetchedUser?.individual &&
                            <>
                                <div className={`section-date flex items-center max-md:hidden text-xl mr-3`}>
                                    <h1 onClick={() => setIsFamilyMode(!isFamilyMode)} className='cursor-pointer capitalize hover:underline'>{isFamilyMode ? 'individual' : 'family'} mode</h1>
                                </div>
                            </>
                        }
                    </div>

                    {/* for smaller screens */}
                    {
                        !fetchedUser?.individual &&
                        <>
                            <div className={`section-date max-md:flex mb-5 items-center mt-4 hidden text-xl mr-3`}>
                                <h1 onClick={() => setIsFamilyMode(!isFamilyMode)} className='cursor-pointer capitalize hover:underline'>{isFamilyMode ? 'individual' : 'family'} mode</h1>
                            </div>
                        </>
                    }

                    <div className="section-header capitalize">
                        {
                            !isByDate && !isAdvancedDate &&
                            <form className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad rounded-lg shadow-md">
                                <div className="mb-4">
                                    <label htmlFor="birthday" className="text-sm font-medium mb-2 flex justify-between">
                                        <h1 className='capitalize'>regular format</h1>
                                        <span onClick={referToAdvancedMode} className='capitalize hover:underline cursor-pointer'>advanced date</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="birthday"
                                        name="selectedDate"
                                        value={formatDateValue(dateState.year, dateState.month, dateState.day)}
                                        onChange={changeHandlerBasicSake}
                                        className="block w-full text-black p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {
                                        isCurrency &&
                                        <>
                                            <label htmlFor="birthday" className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
                                                <h1 className='capitalize hover:underline'>currency</h1>
                                            </label>
                                            <input
                                                type="text"
                                                name="currency"
                                                value={dateState.currency}
                                                onChange={changeHandler}
                                                className="block w-full text-black p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </>
                                    }
                                </div>
                            </form>
                        }
                        {
                            isAdvancedDate && !isByDate &&
                            <form className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad rounded-lg shadow-md">
                                <div className="mb-4">
                                    <label htmlFor="regularf" className="text-sm font-medium mb-3 flex justify-center">
                                        <h1 onClick={() => {
                                            referToCalendar();
                                            setIsAdvancedDate(false)
                                        }
                                        } className='capitalize hover:underline cursor-pointer'>regular format</h1>
                                    </label>

                                    <label htmlFor="day" className="text-sm font-medium mb-2 flex justify-between">
                                        <h1 onClick={referToCalendar} className='capitalize hover:underline'>day</h1>
                                    </label>
                                    <input
                                        type="number"
                                        id="day"
                                        name="day"
                                        onChange={changeHandlerBasicSake}
                                        className="block my-2 w-full text-black p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        maxLength={2}
                                    />
                                    <label htmlFor="month" className="text-sm font-medium mb-2 flex justify-between">
                                        <h1 onClick={referToCalendar} className='capitalize hover:underline'>month</h1>
                                    </label>
                                    <input
                                        type="number"
                                        id="month"
                                        name="month"
                                        onChange={changeHandlerBasicSake}
                                        className="block my-2 w-full text-black p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <label htmlFor="year" className="text-sm font-medium mb-2 flex justify-between">
                                        <h1 onClick={referToCalendar} className='capitalize hover:underline'>year</h1>
                                    </label>
                                    <input
                                        type="number"
                                        id='year'
                                        name="year"
                                        onChange={changeHandlerBasicSake}
                                        className="block my-2 w-full text-black p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {
                                        isCurrency &&
                                        <>
                                            <label htmlFor="currency" className="text-sm font-medium mb-2 flex justify-between">
                                                <h1 onClick={referToCalendar} className='capitalize hover:underline'>currency</h1>
                                            </label>
                                            <input
                                                type="text"
                                                name="currency"
                                                value={dateState.currency}
                                                onChange={changeHandler}
                                                className="block w-full text-black p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </>
                                    }
                                </div>
                            </form>
                        }
                    </div>

                    {/* Reports Overview */}
                    <div className="section my-5">
                        {
                            isCurrency && isByDate &&
                            <>
                                <label htmlFor="currency" className="text-sm font-medium mb-2 flex justify-between">
                                    <h1 onClick={referToCalendar} className='capitalize hover:underline'>currency</h1>
                                </label>
                                <input
                                    type="text"
                                    name="currency"
                                    value={dateState?.currency}
                                    onChange={changeHandler}
                                    className="block w-full p-2.5 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                                />
                            </>
                        }
                        <div className="grid grid-cols-2 gap-4">
                            {fetchedReports?.total?.map((item: totalProps, index: number) => (
                                <div key={index} className="report-item bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad my-3 p-4 rounded-md">
                                    <div className="report-item-header">{item.currency}</div>
                                    <div className="report-item-details">Total Amount: <CountUp start={0} end={item.totalAmount} duration={5} /></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* List of Reports */}
                    <div className="section my-5">
                        <div className="section-header mb-1">List of Reports</div>
                        {reports.slice(0, visibleReports).map((report: reportProps, index: number) => (
                            <div key={index} className="report-item bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad p-4 my-3 rounded-md">
                                <div className="report-item-header">{report?.title}</div>
                                <div className="report-item-details">Quantity: {report?.quantity}</div>
                                <div className="report-item-details">Total Amount: {report?.total}</div>
                                <div className="report-item-details">Price: {report?.price}</div>
                                <div className="report-item-details">Currency: {report?.currency}</div>
                                <div className="report-item-details">Date: {report?.date}</div>
                                <div className="report-item-details">Time: {report?.time}</div>
                                {/* Add more details as needed */}
                            </div>
                        ))}
                        {loading && <div className="loading-spinner"></div>}
                        {visibleReports < reports.length && !loading && (
                            <button onClick={handleLoadMore} className="load-more-button bg-blue-500 text-white py-2 px-4 rounded-md">
                                Load More
                            </button>
                        )}
                    </div>
                    {/* Expensive Items */}
                    <div className="section my-5">
                        <div className="section-header mb-1">Expensive Items</div>
                        {fetchedReports?.expensive?.map((item: reportProps, index: number) => (
                            <div key={index} className="report-item bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad p-4 my-3 rounded-md">
                                <div className="report-item-header">{item.title}</div>
                                <div className="report-item-details">Total Amount: {item.total}</div>
                                <div className="report-item-details">Currency: {item.currency}</div>
                                {/* Add more details as needed */}
                            </div>
                        ))}
                    </div>
                    {/* Large Quantity Items */}
                    <div className="section my-5">
                        <div className="section-header mb-1">Large Quantity Items</div>
                        {fetchedReports?.largeQty.map((item: reportProps, index: number) => (
                            <div key={index} className="report-item bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-colors duration-500 in-out-quad p-4 my-3 rounded-md">
                                <div className="report-item-header">{item?.title}</div>
                                <div className="report-item-details">Total Amount: {item?.total}</div>
                                <div className="report-item-details">Currency: {item?.currency}</div>
                            </div>
                        ))}
                    </div>

                    {
                        fetchedReports?.reports?.length === 0 &&
                        <>
                            <div className="flex justify-center items-center pt-28">
                                <div className="text-center rounded p-8">
                                    <img src="empty_reports.svg" alt="No reports available" className="mb-4 mx-auto" />
                                    <h1 className="text-lg font-medium">No data found for the specified case</h1>
                                </div>
                            </div>
                        </>
                    }

                </div>
            </div >
        </>
    )
}