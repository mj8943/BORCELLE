$(function () {
  let salesChart = null;
  let paymentChart = null;
  let categoryChart = null;
  let productChart = null;

  const fetchDashBoardData = async (timeFrame) => {
    const rawData = await fetch(`/admin/dashboard-data?time=${timeFrame}`);
    if (rawData.ok) {
      const data = await rawData.json();
      if (data.status === "success") {
        const { customers, payment, sales, salesDetails } = data;

        document.getElementById("AmountTotal").innerHTML = sales.totalAmount;
        // document.getElementById('amountTotal').innerHTML = sales.totalAmount

        console.log("customers", customers);
        console.log(payment.paypal);
        console.log(payment.cod);
        // console.log(salesDetails{totalAmount});

        salesGraph(sales, salesDetails);
        paymentGraph(payment);
      }
    }
  };

  // =====================================
  // Profit
  // =====================================

  // Initialize a global variable to store the ApexCharts instance

  function salesGraph(sale, salesDetails) {
    let orderCount = sale.orderCount;
    let label = sale.label;
const count=orderCount.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
console.log(count,"count")

    // Check if the chart instance is already created
    if (!salesChart) {
      // If not, create a new instance
      salesChart = new ApexCharts(document.querySelector("#chart"), {
        series: [{ name: "Orders ", data: orderCount }],
        chart: {
          type: "bar",
          height: 345,
          offsetX: -15,
          toolbar: { show: true },
          foreColor: "#adb0bb",
          fontFamily: "inherit",
          sparkline: { enabled: false },
        },
        colors: ["rgb(112, 7, 7)"],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "35%",
            borderRadius: [6],
            borderRadiusApplication: "end",
            borderRadiusWhenStacked: "all",
          },
        },
        markers: { size: 0 },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        grid: {
          borderColor: "rgba(0,0,0,0.1)",
          strokeDashArray: 3,
          xaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis: {
          type: "category",
          categories: label,
          labels: {
            style: { cssClass: "grey--text lighten-2--text fill-color" },
          },
        },
        yaxis: {
          show: true,
          min: 0,
          max: count + 2, // Adjust the max value based on your data
          tickAmount: 4,
          labels: {
            style: {
              cssClass: "grey--text lighten-2--text fill-color",
            },
          },
        },
        stroke: {
          show: true,
          width: 3,
          lineCap: "butt",
          colors: ["transparent"],
        },
        tooltip: { theme: "light" },
        responsive: [
          {
            breakpoint: 600,
            options: {
              plotOptions: {
                bar: {
                  borderRadius: 3,
                },
              },
            },
          },
        ],
      });

      // Render the chart
      salesChart.render();
    } else {
      // If the chart instance already exists, update its configuration and data
      salesChart.updateOptions({
        xaxis: {
          categories: label,
        },
        yaxis: {
          max: Math.max(...orderCount) + 2,
          tickAmount: Math.max(...orderCount) + 2,
        },
      });

      salesChart.updateSeries([{ data: orderCount }]);
    }

    // =====================================
    // Earning
    // =====================================
    var earning = {
      chart: {
        type: "pie", // Set chart type to "pie" for a pie chart
        fontFamily: "Plus Jakarta Sans', sans-serif",
        foreColor: "rgb(112, 7, 7)",
      },
      series: orderCount, // Use the order count data for the series
      labels: label, // Use the label data for the pie chart labels
      stroke: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      colors: ["rgb(112, 7, 7)", "darkgray"],
      tooltip: {
        theme: "dark",
      },
    };
    new ApexCharts(document.querySelector("#earning"), earning).render();

    
  }

  let chart; // Declare a global variable to store the chart instance

  function paymentGraph(payment) {
    console.log("Payment:", payment);
    let paypal = payment.paypal;
    let COD = payment.cod;
    console.log("paypal:", paypal);
    console.log("COD:", COD);

    // Destroy the existing chart if it exists
    if (chart) {
      chart.destroy();
    }

    var breakup = {
      color: "rgb(112, 7, 7)",
      series: [COD, paypal],
      labels: ["COD", "paypal"], // Added "Wallet" to labels
      chart: {
        width: 180,
        type: "donut",
        fontFamily: "Plus Jakarta Sans', sans-serif",
        foreColor: "rgb(112, 7, 7)",
      },
      plotOptions: {
        pie: {
          startAngle: 0,
          endAngle: 360,
          donut: {
            size: "75%",
          },
        },
      },
      stroke: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      colors: ["rgb(112, 7, 7)", "darkgray"], // Added color for "Wallet"
      responsive: [
        {
          breakpoint: 991,
          options: {
            chart: {
              width: 150,
            },
          },
        },
      ],
      tooltip: {
        theme: "dark",
        fillSeriesColor: false,
      },
    };

    chart = new ApexCharts(document.querySelector("#breakup"), breakup);
    chart.render();

  }


  
  // Vanilla JavaScript
  window.addEventListener("load", () => {
    fetchDashBoardData("today");
  });

  const timeBtns = document.querySelectorAll("[data-time]");
  timeBtns.forEach((item) => {
    item.addEventListener("click", (event) => {
      timeBtns.forEach((item) => {
        item.classList.remove("time-frame-active");
      });
      fetchDashBoardData(event.currentTarget.dataset.time);
      event.currentTarget.classList.add("time-frame-active");
    });
  });
});
