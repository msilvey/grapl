export const nodeFillColor = (nodeType: string) => {
	switch (nodeType) {
		case "Asset":
			return "#FF7171";
		case "File":
			return "#FF9744";
		case "IpAddress":
			return "#6CF4AB";
		case "IpConnections":
			return "#6FDCE5";
		case "IpPort":
			return "#710EF0";
		case "NetworkConnection":
			return "#FFFFFF";
		case "Process":
			return "#BDBDBD";
		case "ProcessInboundConnection":
			return "#655F5F";
		case "ProcessOutboundConnection":
			return "#242899";
		case "Risk":
			return "#040202";
		default:
			return "#42C6FF";
	}
};

export const riskOutline = (risk: number) => {
	if (risk >= 0 && risk <= 25) {
		return "#02D084";
	}
	if (risk >= 26 && risk <= 50) {
		return "#13A5E3";
	}
	if (risk >= 51 && risk <= 75) {
		return "#FFD773";
	}
	if (risk >= 76 && risk <= 100) {
		return "#AD2925";
	}
};

